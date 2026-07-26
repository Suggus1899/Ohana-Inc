import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { transactionLimitsMiddleware } from '../middleware/transaction-limits.middleware';
import multer from 'multer';
import {
  createTransaction,
  approveTransaction,
  rejectTransaction,
  submitPayment,
  confirmPayment,
  cancelTransaction,
  getMyTransactions,
  getAllTransactions,
  getTransactionDetails,
  getTransactionStats,
  refundTransaction,
  getTransactionByRentalRequest,
} from '../controllers/transaction.controller';

const router = Router();

// Configurar multer para comprobantes de pago
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/payment-proofs/',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'proof-' + uniqueSuffix + '-' + file.originalname);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes y PDFs.'));
    }
  },
});

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todas las transacciones (admin/operator) — debe ir antes de /:id
router.get('/', requireRole(['admin', 'operator']), getAllTransactions);

// Obtener mis transacciones
router.get('/my', getMyTransactions);

// Obtener transacción por rentalRequestId
router.get('/by-rental-request/:rentalRequestId', getTransactionByRentalRequest);

// Estadísticas (admin/operator)
router.get('/stats', requireRole(['admin', 'operator']), getTransactionStats);

// Obtener detalles de transacción
router.get('/:id', getTransactionDetails);

// Crear solicitud de transacción (con límites)
router.post('/', transactionLimitsMiddleware, createTransaction);

// Aprobar solicitud (propietario)
router.post('/:id/approve', approveTransaction);

// Rechazar solicitud (propietario)
router.post('/:id/reject', rejectTransaction);

// Marcar pago como realizado (cliente)
router.post('/:id/submit-payment', upload.array('paymentProof', 5), submitPayment);

// Confirmar recepción de pago (propietario)
router.post('/:id/confirm-payment', confirmPayment);

// Cancelar transacción
router.post('/:id/cancel', cancelTransaction);

// Reembolsar transacción (admin/operator)
router.post('/:id/refund', requireRole(['admin', 'operator']), refundTransaction);

export default router;
