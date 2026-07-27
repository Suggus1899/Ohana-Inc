/// <reference types="jest" />
import { EscrowService } from '../src/services/escrow.service';

// Inline Sequelize model mock factory (cannot import due to jest.mock hoisting TDZ).
function modelMock(namedExports: Record<string, any> = {}) {
  const Model = jest.fn().mockImplementation(() => ({}));
  for (const name of [
    'findAll', 'findOne', 'findByPk', 'findOrCreate', 'findAndCountAll',
    'create', 'update', 'destroy', 'count', 'bulkCreate', 'upsert',
    'init', 'associate', 'hasOne', 'belongsTo', 'hasMany', 'belongsToMany',
    'addHook', 'removeAttribute', 'scope',
  ]) {
    (Model as any)[name] = jest.fn();
  }
  return { __esModule: true, default: Model, ...namedExports };
}

jest.mock('../src/models/index', () => ({}));
jest.mock('../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn((cb: (t: any) => Promise<any>) => cb({})),
    define: jest.fn().mockReturnValue({}),
  },
}));
jest.mock('../src/models/Transaction', () => modelMock({
  TransactionStatus: {
    PENDING_OWNER_APPROVAL: 'pending_owner_approval',
    PENDING_PAYMENT: 'pending_payment',
    PAYMENT_SUBMITTED: 'payment_submitted',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected',
    DISPUTED: 'disputed',
    REFUNDED: 'refunded',
    EXPIRED: 'expired',
  },
  EscrowStatus: {
    NONE: 'none',
    HOLDING: 'holding',
    RELEASED: 'released',
    REFUNDED: 'refunded',
    FROZEN: 'frozen',
  },
}));
jest.mock('../src/models/Property', () => modelMock());
jest.mock('../src/models/PropertyAssignment', () => modelMock());
jest.mock('../src/models/RentalRequest', () => modelMock());
jest.mock('../src/models/TransactionTimeline', () => modelMock());

import Transaction, { TransactionStatus, EscrowStatus } from '../src/models/Transaction';
import Property from '../src/models/Property';
import PropertyAssignment from '../src/models/PropertyAssignment';
import RentalRequest from '../src/models/RentalRequest';
import TransactionTimeline from '../src/models/TransactionTimeline';

const MockTransaction = Transaction as jest.Mocked<typeof Transaction>;
const MockProperty = Property as jest.Mocked<typeof Property>;
const MockPropertyAssignment = PropertyAssignment as jest.Mocked<typeof PropertyAssignment>;
const MockRentalRequest = RentalRequest as jest.Mocked<typeof RentalRequest>;
const MockTimeline = TransactionTimeline as jest.Mocked<typeof TransactionTimeline>;

describe('EscrowService - Property Status Automation', () => {
  let escrowService: EscrowService;

  beforeEach(() => {
    escrowService = new EscrowService();
    jest.clearAllMocks();
  });

  describe('releasePayment', () => {
    it('debe cambiar propiedad a rented cuando se confirma pago de alquiler', async () => {
      const mockTransaction = {
        id: 1,
        propertyId: 10,
        clientId: 20,
        ownerId: 30,
        status: TransactionStatus.PAYMENT_SUBMITTED,
        escrowStatus: EscrowStatus.HOLDING,
        rentalRequestId: 100,
        property: { id: 10, listingType: 'Alquiler', status: 'approved' },
        update: jest.fn().mockResolvedValue(undefined),
      } as any;

      MockTransaction.findByPk.mockResolvedValue(mockTransaction);
      MockProperty.update.mockResolvedValue([1]);
      MockRentalRequest.update.mockResolvedValue([1]);
      MockPropertyAssignment.create.mockResolvedValue({});
      MockTimeline.create.mockResolvedValue({});

      await escrowService.releasePayment(1, 30);

      // Verificar que la propiedad se actualizó a 'rented'
      expect(MockProperty.update).toHaveBeenCalledWith(
        { status: 'rented' },
        { where: { id: 10 }, transaction: expect.any(Object) }
      );
    });

    it('debe cambiar propiedad a sold cuando se confirma pago de venta', async () => {
      const mockTransaction = {
        id: 2,
        propertyId: 11,
        clientId: 21,
        ownerId: 31,
        status: TransactionStatus.PAYMENT_SUBMITTED,
        escrowStatus: EscrowStatus.HOLDING,
        rentalRequestId: 101,
        property: { id: 11, listingType: 'Venta', status: 'approved' },
        update: jest.fn().mockResolvedValue(undefined),
      } as any;

      MockTransaction.findByPk.mockResolvedValue(mockTransaction);
      MockProperty.update.mockResolvedValue([1]);
      MockRentalRequest.update.mockResolvedValue([1]);
      MockPropertyAssignment.create.mockResolvedValue({});
      MockTimeline.create.mockResolvedValue({});

      await escrowService.releasePayment(2, 31);

      // Verificar que la propiedad se actualizó a 'sold'
      expect(MockProperty.update).toHaveBeenCalledWith(
        { status: 'sold' },
        { where: { id: 11 }, transaction: expect.any(Object) }
      );
    });

    it('debe crear PropertyAssignment al confirmar pago', async () => {
      const mockTransaction = {
        id: 3,
        propertyId: 12,
        clientId: 22,
        ownerId: 32,
        status: TransactionStatus.PAYMENT_SUBMITTED,
        escrowStatus: EscrowStatus.HOLDING,
        rentalRequestId: 102,
        property: { id: 12, listingType: 'Alquiler' },
        update: jest.fn().mockResolvedValue(undefined),
      } as any;

      MockTransaction.findByPk.mockResolvedValue(mockTransaction);
      MockProperty.update.mockResolvedValue([1]);
      MockRentalRequest.update.mockResolvedValue([1]);
      MockTimeline.create.mockResolvedValue({});

      await escrowService.releasePayment(3, 32);

      expect(MockPropertyAssignment.create).toHaveBeenCalledWith({
        propertyId: 12,
        clientId: 22,
        transactionId: 3,
        startDate: expect.any(Date),
        status: 'active',
      }, { transaction: expect.any(Object) });
    });

    it('debe actualizar RentalRequest a completed al confirmar pago', async () => {
      const mockTransaction = {
        id: 4,
        propertyId: 13,
        clientId: 23,
        ownerId: 33,
        status: TransactionStatus.PAYMENT_SUBMITTED,
        escrowStatus: EscrowStatus.HOLDING,
        rentalRequestId: 103,
        property: { id: 13, listingType: 'Alquiler' },
        update: jest.fn().mockResolvedValue(undefined),
      } as any;

      MockTransaction.findByPk.mockResolvedValue(mockTransaction);
      MockProperty.update.mockResolvedValue([1]);
      MockRentalRequest.update.mockResolvedValue([1]);
      MockPropertyAssignment.create.mockResolvedValue({});
      MockTimeline.create.mockResolvedValue({});

      await escrowService.releasePayment(4, 33);

      expect(MockRentalRequest.update).toHaveBeenCalledWith(
        { status: 'completed' },
        { where: { id: 103 }, transaction: expect.any(Object) }
      );
    });
  });
});
