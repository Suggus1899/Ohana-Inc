import { TransactionStateMachine } from '../../src/utils/transaction-state-machine';
import { TransactionStatus } from '../../src/models/Transaction';

describe('TransactionStateMachine', () => {
  describe('canTransition', () => {
    it('should allow PENDING_OWNER_APPROVAL → PENDING_PAYMENT', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PENDING_OWNER_APPROVAL,
          TransactionStatus.PENDING_PAYMENT
        )
      ).toBe(true);
    });

    it('should allow PENDING_OWNER_APPROVAL → REJECTED', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PENDING_OWNER_APPROVAL,
          TransactionStatus.REJECTED
        )
      ).toBe(true);
    });

    it('should allow PENDING_OWNER_APPROVAL → CANCELLED', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PENDING_OWNER_APPROVAL,
          TransactionStatus.CANCELLED
        )
      ).toBe(true);
    });

    it('should allow PENDING_PAYMENT → PAYMENT_SUBMITTED', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PENDING_PAYMENT,
          TransactionStatus.PAYMENT_SUBMITTED
        )
      ).toBe(true);
    });

    it('should allow PAYMENT_SUBMITTED → PAYMENT_CONFIRMED', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PAYMENT_SUBMITTED,
          TransactionStatus.PAYMENT_CONFIRMED
        )
      ).toBe(true);
    });

    it('should allow PAYMENT_SUBMITTED → DISPUTED', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PAYMENT_SUBMITTED,
          TransactionStatus.DISPUTED
        )
      ).toBe(true);
    });

    it('should allow PAYMENT_CONFIRMED → COMPLETED', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PAYMENT_CONFIRMED,
          TransactionStatus.COMPLETED
        )
      ).toBe(true);
    });

    it('should allow DISPUTED → REFUNDED', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.DISPUTED,
          TransactionStatus.REFUNDED
        )
      ).toBe(true);
    });

    it('should allow DISPUTED → PAYMENT_CONFIRMED', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.DISPUTED,
          TransactionStatus.PAYMENT_CONFIRMED
        )
      ).toBe(true);
    });

    // Invalid transitions
    it('should NOT allow PENDING_OWNER_APPROVAL → COMPLETED', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PENDING_OWNER_APPROVAL,
          TransactionStatus.COMPLETED
        )
      ).toBe(false);
    });

    it('should NOT allow COMPLETED → anything', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.COMPLETED,
          TransactionStatus.CANCELLED
        )
      ).toBe(false);
    });

    it('should NOT allow CANCELLED → anything', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.CANCELLED,
          TransactionStatus.PENDING_PAYMENT
        )
      ).toBe(false);
    });

    it('should NOT allow REJECTED → anything', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.REJECTED,
          TransactionStatus.PENDING_PAYMENT
        )
      ).toBe(false);
    });

    it('should NOT allow REFUNDED → anything', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.REFUNDED,
          TransactionStatus.COMPLETED
        )
      ).toBe(false);
    });

    it('should NOT allow PENDING_PAYMENT → COMPLETED (skip step)', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PENDING_PAYMENT,
          TransactionStatus.COMPLETED
        )
      ).toBe(false);
    });

    it('should NOT allow PAYMENT_SUBMITTED → PENDING_PAYMENT (backwards)', () => {
      expect(
        TransactionStateMachine.canTransition(
          TransactionStatus.PAYMENT_SUBMITTED,
          TransactionStatus.PENDING_PAYMENT
        )
      ).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('should not throw for valid transitions', () => {
      expect(() =>
        TransactionStateMachine.validateTransition(
          TransactionStatus.PENDING_OWNER_APPROVAL,
          TransactionStatus.PENDING_PAYMENT
        )
      ).not.toThrow();
    });

    it('should throw for invalid transitions', () => {
      expect(() =>
        TransactionStateMachine.validateTransition(
          TransactionStatus.COMPLETED,
          TransactionStatus.CANCELLED
        )
      ).toThrow('Transición inválida');
    });
  });

  describe('isTerminalState', () => {
    it('should return true for COMPLETED', () => {
      expect(TransactionStateMachine.isTerminalState(TransactionStatus.COMPLETED)).toBe(true);
    });

    it('should return true for CANCELLED', () => {
      expect(TransactionStateMachine.isTerminalState(TransactionStatus.CANCELLED)).toBe(true);
    });

    it('should return true for REJECTED', () => {
      expect(TransactionStateMachine.isTerminalState(TransactionStatus.REJECTED)).toBe(true);
    });

    it('should return true for REFUNDED', () => {
      expect(TransactionStateMachine.isTerminalState(TransactionStatus.REFUNDED)).toBe(true);
    });

    it('should return true for EXPIRED', () => {
      expect(TransactionStateMachine.isTerminalState(TransactionStatus.EXPIRED)).toBe(true);
    });

    it('should return false for PENDING_OWNER_APPROVAL', () => {
      expect(TransactionStateMachine.isTerminalState(TransactionStatus.PENDING_OWNER_APPROVAL)).toBe(false);
    });

    it('should return false for PAYMENT_SUBMITTED', () => {
      expect(TransactionStateMachine.isTerminalState(TransactionStatus.PAYMENT_SUBMITTED)).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return correct transitions for PENDING_OWNER_APPROVAL', () => {
      const allowed = TransactionStateMachine.getAllowedTransitions(TransactionStatus.PENDING_OWNER_APPROVAL);
      expect(allowed).toContain(TransactionStatus.PENDING_PAYMENT);
      expect(allowed).toContain(TransactionStatus.REJECTED);
      expect(allowed).toContain(TransactionStatus.CANCELLED);
      expect(allowed).toContain(TransactionStatus.EXPIRED);
      expect(allowed).toHaveLength(4);
    });

    it('should return empty array for terminal states', () => {
      expect(TransactionStateMachine.getAllowedTransitions(TransactionStatus.COMPLETED)).toHaveLength(0);
      expect(TransactionStateMachine.getAllowedTransitions(TransactionStatus.CANCELLED)).toHaveLength(0);
    });
  });
});

describe('TransactionExpiryService', () => {
  // Import separately to avoid DB connection issues in unit tests
  const { TransactionExpiryService } = require('../../src/services/transaction-expiry.service');

  describe('calculateExpiryTime', () => {
    it('should return 48 hours for PENDING_OWNER_APPROVAL', () => {
      const before = new Date();
      const expiry = TransactionExpiryService.calculateExpiryTime(TransactionStatus.PENDING_OWNER_APPROVAL);
      const after = new Date();

      // Should be approximately 48 hours from now
      const diffHours = (expiry.getTime() - before.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThanOrEqual(47.9);
      expect(diffHours).toBeLessThanOrEqual(48.1);
    });

    it('should return 24 hours for PENDING_PAYMENT', () => {
      const before = new Date();
      const expiry = TransactionExpiryService.calculateExpiryTime(TransactionStatus.PENDING_PAYMENT);

      const diffHours = (expiry.getTime() - before.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThanOrEqual(23.9);
      expect(diffHours).toBeLessThanOrEqual(24.1);
    });

    it('should return 72 hours for PAYMENT_SUBMITTED', () => {
      const before = new Date();
      const expiry = TransactionExpiryService.calculateExpiryTime(TransactionStatus.PAYMENT_SUBMITTED);

      const diffHours = (expiry.getTime() - before.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThanOrEqual(71.9);
      expect(diffHours).toBeLessThanOrEqual(72.1);
    });

    it('should default to 24 hours for unknown status', () => {
      const before = new Date();
      const expiry = TransactionExpiryService.calculateExpiryTime('unknown_status' as any);

      const diffHours = (expiry.getTime() - before.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThanOrEqual(23.9);
      expect(diffHours).toBeLessThanOrEqual(24.1);
    });
  });
});
