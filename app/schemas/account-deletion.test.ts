import { describe, it, expect } from 'vitest';
import {
  requestDeletionSchema,
  deletionStatusSchema,
  ACCOUNT_DELETION_SCHEMA_LIMITS,
} from './account-deletion';

describe('account-deletion schema', () => {
  describe('requestDeletionSchema', () => {
    describe('valid payloads', () => {
      it('should validate email and password', () => {
        const result = requestDeletionSchema.safeParse({
          email: 'user@example.com',
          password: 'mypassword',
        });

        expect(result.success).toBe(true);
        expect(result.data?.email).toBe('user@example.com');
        expect(result.data?.password).toBe('mypassword');
      });

      it('should trim whitespace from email', () => {
        const result = requestDeletionSchema.safeParse({
          email: '  user@example.com  ',
          password: 'mypassword',
        });

        expect(result.success).toBe(true);
        expect(result.data?.email).toBe('user@example.com');
      });

      it('should accept email at max length', () => {
        const localPart = 'a'.repeat(ACCOUNT_DELETION_SCHEMA_LIMITS.EMAIL_MAX_LENGTH - '@b.co'.length);
        const maxEmail = `${localPart}@b.co`;
        const result = requestDeletionSchema.safeParse({
          email: maxEmail,
          password: 'mypassword',
        });

        expect(result.success).toBe(true);
        expect(result.data?.email).toBe(maxEmail);
      });
    });

    describe('invalid payloads', () => {
      it('should reject empty email', () => {
        const result = requestDeletionSchema.safeParse({
          email: '',
          password: 'mypassword',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe('Email is required');
      });

      it('should reject malformed email', () => {
        const result = requestDeletionSchema.safeParse({
          email: 'not-an-email',
          password: 'mypassword',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe('Please enter a valid email address');
      });

      it('should reject missing password', () => {
        const result = requestDeletionSchema.safeParse({
          email: 'user@example.com',
        });

        expect(result.success).toBe(false);
      });

      it('should reject empty password', () => {
        const result = requestDeletionSchema.safeParse({
          email: 'user@example.com',
          password: '',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe('Password is required');
      });

      it('should reject email over max length', () => {
        const localPart = 'a'.repeat(ACCOUNT_DELETION_SCHEMA_LIMITS.EMAIL_MAX_LENGTH - '@b.co'.length + 1);
        const longEmail = `${localPart}@b.co`;
        const result = requestDeletionSchema.safeParse({
          email: longEmail,
          password: 'mypassword',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`${ACCOUNT_DELETION_SCHEMA_LIMITS.EMAIL_MAX_LENGTH} characters or fewer`);
      });
    });
  });

  describe('deletionStatusSchema', () => {
    describe('valid payloads', () => {
      it('should validate pending status with all fields populated', () => {
        const result = deletionStatusSchema.safeParse({
          isPending: true,
          requestedAt: '2025-01-15T10:00:00Z',
          expiresAt: '2025-01-22T10:00:00Z',
          daysRemaining: 7,
        });

        expect(result.success).toBe(true);
        expect(result.data?.isPending).toBe(true);
        expect(result.data?.daysRemaining).toBe(7);
      });

      it('should validate non-pending status with null fields', () => {
        const result = deletionStatusSchema.safeParse({
          isPending: false,
          requestedAt: null,
          expiresAt: null,
          daysRemaining: null,
        });

        expect(result.success).toBe(true);
        expect(result.data?.isPending).toBe(false);
        expect(result.data?.requestedAt).toBeNull();
        expect(result.data?.expiresAt).toBeNull();
        expect(result.data?.daysRemaining).toBeNull();
      });
    });

    describe('invalid payloads', () => {
      it('should reject missing isPending', () => {
        const result = deletionStatusSchema.safeParse({
          requestedAt: null,
          expiresAt: null,
          daysRemaining: null,
        });

        expect(result.success).toBe(false);
      });

      it('should reject daysRemaining as float', () => {
        const result = deletionStatusSchema.safeParse({
          isPending: true,
          requestedAt: '2025-01-15T10:00:00Z',
          expiresAt: '2025-01-22T10:00:00Z',
          daysRemaining: 6.5,
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('ACCOUNT_DELETION_SCHEMA_LIMITS constants', () => {
    it('should have correct limits', () => {
      expect(ACCOUNT_DELETION_SCHEMA_LIMITS.PASSWORD_MIN_LENGTH).toBe(1);
      expect(ACCOUNT_DELETION_SCHEMA_LIMITS.EMAIL_MAX_LENGTH).toBe(255);
    });
  });
});
