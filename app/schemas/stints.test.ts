import { describe, expect, it } from 'vitest';
import { stintCompletionSchema } from './stints';

describe('stints schema', () => {
  describe('stintCompletionSchema', () => {
    describe('attributedDate validation', () => {
      const validBase = {
        stintId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        completionType: 'manual' as const,
      };

      it('should accept valid YYYY-MM-DD format', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          attributedDate: '2025-01-15',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.attributedDate).toBe('2025-01-15');
        }
      });

      it('should accept omitted attributedDate (optional)', () => {
        const result = stintCompletionSchema.safeParse(validBase);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.attributedDate).toBeUndefined();
        }
      });

      it('should reject invalid date format YYYY/MM/DD', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          attributedDate: '2025/01/15',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY-MM-DD');
        }
      });

      it('should reject invalid date format MM-DD-YYYY', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          attributedDate: '01-15-2025',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY-MM-DD');
        }
      });

      it('should reject single-digit month/day', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          attributedDate: '2025-1-5',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('YYYY-MM-DD');
        }
      });

      it('should reject empty string', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          attributedDate: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-date strings', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          attributedDate: 'not-a-date',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('completionType validation', () => {
      const validBase = {
        stintId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };

      it('should accept manual completion type', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          completionType: 'manual',
        });
        expect(result.success).toBe(true);
      });

      it('should accept auto completion type', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          completionType: 'auto',
        });
        expect(result.success).toBe(true);
      });

      it('should accept interrupted completion type', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          completionType: 'interrupted',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid completion type', () => {
        const result = stintCompletionSchema.safeParse({
          ...validBase,
          completionType: 'invalid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('manual, auto, or interrupted');
        }
      });
    });

    describe('stintId validation', () => {
      it('should accept valid UUID', () => {
        const result = stintCompletionSchema.safeParse({
          stintId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          completionType: 'manual',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID', () => {
        const result = stintCompletionSchema.safeParse({
          stintId: 'not-a-uuid',
          completionType: 'manual',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('valid stint id');
        }
      });

      it('should reject missing stintId', () => {
        const result = stintCompletionSchema.safeParse({
          completionType: 'manual',
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
