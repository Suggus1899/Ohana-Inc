import { Response } from "express";
import { Op } from "sequelize";
import { RentalRequest as RentRequest, Property, User, Transaction } from "../models";
import { AuthRequest, UserRole } from "../types";
import { TransactionService } from "../services/transaction.service";
import { TransactionStatus } from "../models/Transaction";
import { getIO } from "../websocket/socket";
import { notificationInAppService } from "../services/notification-inapp.service";

// Roles that are exempt from the rule of 5 (always can request)
const EXEMPT_ROLES: UserRole[] = ["admin", "operator", "propietario"];

// Roles that get 5 free requests before requiring KYC
const LIMITED_ROLES: UserRole[] = ["cliente", "estudiante"];

// Max free requests before KYC is required
const MAX_FREE_REQUESTS = 5;

// Minimum verification level required after exhausting free requests
const MIN_VERIFICATION_LEVEL = 2; // Documentos enviados

export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.userId;
    const userRole = req.user?.role as UserRole;
    const verificationLevel = req.user?.verificationLevel ?? 0;
    const { propertyId, message, moveInDate, phoneNumber, leaseDuration } =
      req.body;

    // Check user has no disputed transactions
    const dispute = await Transaction.findOne({
      where: {
        clientId: tenantId as any,
        status: TransactionStatus.DISPUTED,
      },
    });
    if (dispute) {
      return res.status(409).json({
        success: false,
        error: {
          code: "USER_HAS_DISPUTE",
          message: "No puedes solicitar propiedades mientras tengas una transacción en disputa",
        },
      });
    }

    // Rule of 5: students/clients get 5 free requests, then need KYC
    if (LIMITED_ROLES.includes(userRole) && !EXEMPT_ROLES.includes(userRole)) {
      const requestCount = await RentRequest.count({
        where: { tenantId: tenantId as any },
      });

      if (requestCount >= MAX_FREE_REQUESTS && verificationLevel < MIN_VERIFICATION_LEVEL) {
        return res.status(403).json({
          success: false,
          error: {
            code: "VERIFICATION_REQUIRED",
            message: `Has alcanzado el límite de ${MAX_FREE_REQUESTS} solicitudes. Debes completar la verificación de identidad para continuar solicitando propiedades.`,
            details: {
              requestCount,
              maxFreeRequests: MAX_FREE_REQUESTS,
              remainingFree: Math.max(0, MAX_FREE_REQUESTS - requestCount),
              verificationRequired: true,
            },
          },
        });
      }
    }

    // Check for existing active request for same property by same tenant
    const existing = await RentRequest.findOne({
      where: {
        tenantId: tenantId as any,
        propertyId,
        status: { [Op.in]: ["pending", "accepted"] },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_REQUEST",
          message:
            existing.status === "accepted"
              ? "Ya tienes una solicitud aprobada para esta propiedad"
              : "Ya tienes una solicitud pendiente para esta propiedad",
        },
      });
    }

    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res
        .status(404)
        .json({
          success: false,
          error: { message: "Propiedad no encontrada" },
        });
    }

    // Validar que la propiedad esté aprobada para alquiler
    if (property.status !== "approved") {
      return res.status(409).json({
        success: false,
        error: {
          code: "PROPERTY_NOT_AVAILABLE",
          message: "Esta propiedad no está disponible para alquiler",
        },
      });
    }

    // Si es Residencia, verificar que haya habitaciones disponibles
    if (property.type === 'Residencia') {
      const avail = (property as any).availableRooms ?? 0;
      if (avail <= 0) {
        return res.status(409).json({
          success: false,
          error: {
            code: "NO_AVAILABLE_ROOMS",
            message: "No hay habitaciones disponibles para esta residencia",
          },
        });
      }
    }

    const request = await RentRequest.create({
      tenantId: tenantId as any,
      propertyId,
      ownerId: property.authorId,
      message,
      phoneNumber,
      moveInDate: moveInDate || new Date(),
      leaseDuration: leaseDuration === undefined ? 1 : leaseDuration,
      status: "pending",
    });

    // Calculate remaining free requests for limited roles
    let remainingFree: number | undefined;
    if (LIMITED_ROLES.includes(userRole)) {
      const requestCount = await RentRequest.count({
        where: { tenantId: tenantId as any },
      });
      remainingFree = Math.max(0, MAX_FREE_REQUESTS - requestCount);
    }

    res.status(201).json({
      success: true,
      data: {
        request,
        remainingFreeRequests: remainingFree,
      },
    });
  } catch (error: any) {
    console.error('Create rent request error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getUserRequests = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.userId;

    try {
      const requests = await RentRequest.findAll({
        where: { tenantId },
        include: [
          { model: Property, as: "property" },
          {
            model: Transaction,
            as: "transaction",
            attributes: ["id", "status", "notes"],
            required: false,
          },
        ],
      });
      return res.json({ success: true, data: { requests } });
    } catch (includeError) {
      console.warn(
        "Could not include property details in rent requests:",
        includeError,
      );
      const requests = await RentRequest.findAll({ where: { tenantId } });
      return res.json({ success: true, data: { requests } });
    }
  } catch (error: any) {
    console.error("Get rent requests error:", error);
    res.json({ success: true, data: { requests: [] } });
  }
};

export const getReceivedRequests = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user?.userId;

    const properties = await Property.findAll({
      where: { authorId: ownerId },
      attributes: ["id"],
      paranoid: false,
    });

    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return res.json({ success: true, data: { requests: [] } });
    }

    const requests = await RentRequest.findAll({
      where: { propertyId: { [Op.in]: propertyIds } },
      include: [
        {
          model: User,
          as: "tenant",
          attributes: ["id", "name", "email", "phone", "profilePhotoUrl", "isVerified"],
        },
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "address", "price"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data: { requests } });
  } catch (error: any) {
    console.error("Get received requests error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Error al obtener solicitudes" },
    });
  }
};

export const getAllRentRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, propertyId, tenantId, page = 1, limit = 20 } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (propertyId) where.propertyId = Number(propertyId);
    if (tenantId) where.tenantId = Number(tenantId);

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: requests } = await RentRequest.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'tenant',
          attributes: ['id', 'name', 'email', 'phone', 'profilePhotoUrl', 'isVerified'],
        },
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'title', 'address', 'price', 'type', 'listingType'],
        },
      ],
      offset,
      limit: Number(limit),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Get all rent requests error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error al obtener solicitudes' },
    });
  }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    const request = await RentRequest.findByPk(id, {
      include: [{ model: Property, as: "property" }],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: { message: "Solicitud no encontrada" },
      });
    }

    // Permission validation: Only property owner can approve/reject
    if (status === "accepted" || status === "rejected") {
      const property = await Property.findByPk(request.propertyId);

      if (!property || property.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: "No tienes permiso para modificar esta solicitud" },
        });
      }
    }

    // Only tenant can cancel
    if (status === "cancelled" && request.tenantId !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: "Solo puedes cancelar tus propias solicitudes" },
      });
    }

    await request.update({ status });

    // Emitir evento por socket al tenant para actualización en tiempo real
    try {
      const io = getIO();
      io.to(`user_${request.tenantId}`).emit('rental_request:status_changed', {
        requestId: request.id,
        status: request.status,
        propertyId: request.propertyId,
      });
    } catch (socketErr) {
      // Socket no inicializado, no bloquear
    }

    // Notify tenant when request is accepted
    if (status === "accepted") {
      try {
        const property = await Property.findByPk(request.propertyId);
        if (property) {
          await notificationInAppService.notifyRentalRequestAccepted(
            request.tenantId,
            property.title,
            property.id,
          );
        }
      } catch (notifErr) {
        console.error('Error sending rental request accepted notification:', notifErr);
      }
    }

    // If approved, create Transaction automatically
    if (status === "accepted") {
      const property = await Property.findByPk(request.propertyId);

      if (property) {
        try {
          const transactionService = new TransactionService();
          const transaction = await transactionService.createTransaction(
            property.id,
            request.tenantId,
            {
              amount: property.price,
              currency: "USD",
              notes: `Transacción generada desde solicitud #${request.id}`,
              rentalRequestId: request.id,
            },
            TransactionStatus.PENDING_PAYMENT
          );
          console.log(
            `✅ Transaction ${transaction.id} creada para solicitud ${request.id}`,
          );
        } catch (txError) {
          console.error("Error creando transacción:", txError);
          // Don't fail the approval if transaction creation fails
        }
      }
    }

    res.json({ success: true, data: { request } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
