import { describe, it, expect } from 'vitest';
import {
  projectCreateSchema,
  projectUpdateSchema,
  PROJECT_SCHEMA_LIMITS,
} from '~/schemas/projects';

/**
 * Schema Validation Tests for Projects
 *
 * Tests Zod schema validation for project creation and updates.
 * Validates:
 * - Empty names rejected
 * - Names >255 chars rejected (or configured max)
 * - Zero or negative daily stints rejected
 * - Zero or negative stint duration rejected
 * - Valid inputs accepted with defaults
 *
 * Prerequisites:
 * - Project schemas defined in app/schemas/projects.ts
 * - Zod validation library installed
 */

describe('Project Schema Validation', () => {
  describe('projectCreateSchema', () => {
    describe('name validation', () => {
      it('should reject empty name', () => {
        const result = projectCreateSchema.safeParse({
          name: '',
          expectedDailyStints: 3,
          customStintDuration: 45,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['name']);
          expect(result.error.issues[0].message).toContain('at least');
        }
      });

      it('should reject name shorter than minimum length', () => {
        const result = projectCreateSchema.safeParse({
          name: 'A', // Only 1 character, min is 2
          expectedDailyStints: 3,
          customStintDuration: 45,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['name']);
        }
      });

      it('should reject name longer than maximum length', () => {
        const longName = 'A'.repeat(PROJECT_SCHEMA_LIMITS.NAME_MAX + 1);

        const result = projectCreateSchema.safeParse({
          name: longName,
          expectedDailyStints: 3,
          customStintDuration: 45,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['name']);
          expect(result.error.issues[0].message).toContain('characters');
        }
      });

      it('should accept valid name at minimum length', () => {
        const minName = 'AB'; // 2 characters

        const result = projectCreateSchema.safeParse({
          name: minName,
          expectedDailyStints: 3,
          customStintDuration: 45,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe(minName);
        }
      });

      it('should accept valid name at maximum length', () => {
        const maxName = 'A'.repeat(PROJECT_SCHEMA_LIMITS.NAME_MAX);

        const result = projectCreateSchema.safeParse({
          name: maxName,
          expectedDailyStints: 3,
          customStintDuration: 45,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe(maxName);
        }
      });

      it('should trim whitespace from name', () => {
        const result = projectCreateSchema.safeParse({
          name: '  Valid Project Name  ',
          expectedDailyStints: 3,
          customStintDuration: 45,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Valid Project Name');
        }
      });
    });

    describe('expectedDailyStints validation', () => {
      it('should reject zero expected daily stints', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: 0,
          customStintDuration: 45,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['expectedDailyStints']);
        }
      });

      it('should reject negative expected daily stints', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: -1,
          customStintDuration: 45,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['expectedDailyStints']);
        }
      });

      it('should reject non-integer expected daily stints', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: 3.5,
          customStintDuration: 45,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['expectedDailyStints']);
        }
      });

      it('should accept minimum valid expected daily stints', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: PROJECT_SCHEMA_LIMITS.DAILY_STINTS_MIN,
          customStintDuration: 45,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expectedDailyStints).toBe(PROJECT_SCHEMA_LIMITS.DAILY_STINTS_MIN);
        }
      });

      it('should accept maximum valid expected daily stints', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: PROJECT_SCHEMA_LIMITS.DAILY_STINTS_MAX,
          customStintDuration: 45,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expectedDailyStints).toBe(PROJECT_SCHEMA_LIMITS.DAILY_STINTS_MAX);
        }
      });

      it('should apply default value when not provided', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          customStintDuration: 45,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expectedDailyStints).toBe(2); // Default from schema
        }
      });
    });

    describe('customStintDuration validation', () => {
      it('should reject zero stint duration', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: 3,
          customStintDuration: 0,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['customStintDuration']);
        }
      });

      it('should reject negative stint duration', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: 3,
          customStintDuration: -5,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['customStintDuration']);
        }
      });

      it('should reject non-integer stint duration', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: 3,
          customStintDuration: 45.5,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['customStintDuration']);
        }
      });

      it('should accept minimum valid stint duration', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: 3,
          customStintDuration: PROJECT_SCHEMA_LIMITS.CUSTOM_DURATION_MIN_MINUTES,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.customStintDuration).toBe(PROJECT_SCHEMA_LIMITS.CUSTOM_DURATION_MIN_MINUTES);
        }
      });

      it('should accept maximum valid stint duration', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: 3,
          customStintDuration: PROJECT_SCHEMA_LIMITS.CUSTOM_DURATION_MAX_MINUTES,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.customStintDuration).toBe(PROJECT_SCHEMA_LIMITS.CUSTOM_DURATION_MAX_MINUTES);
        }
      });

      it('should accept null stint duration', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: 3,
          customStintDuration: null,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.customStintDuration).toBeNull();
        }
      });

      it('should accept undefined stint duration (omitted)', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Valid Project',
          expectedDailyStints: 3,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('complete valid inputs', () => {
      it('should accept all valid inputs with defaults', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Client Alpha',
          expectedDailyStints: 3,
          customStintDuration: 45,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('Client Alpha');
          expect(result.data.expectedDailyStints).toBe(3);
          expect(result.data.customStintDuration).toBe(45);
        }
      });

      it('should accept minimal valid input with defaults', () => {
        const result = projectCreateSchema.safeParse({
          name: 'AB',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('AB');
          expect(result.data.expectedDailyStints).toBe(2); // Default
        }
      });
    });
  });

  describe('projectUpdateSchema', () => {
    it('should allow partial updates', () => {
      const result = projectUpdateSchema.safeParse({
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.expectedDailyStints).toBeUndefined();
        expect(result.data.customStintDuration).toBeUndefined();
      }
    });

    it('should validate updated name', () => {
      const result = projectUpdateSchema.safeParse({
        name: '', // Invalid
      });

      expect(result.success).toBe(false);
    });

    it('should validate updated expectedDailyStints', () => {
      const result = projectUpdateSchema.safeParse({
        expectedDailyStints: 0, // Invalid
      });

      expect(result.success).toBe(false);
    });

    it('should validate updated customStintDuration', () => {
      const result = projectUpdateSchema.safeParse({
        customStintDuration: -1, // Invalid
      });

      expect(result.success).toBe(false);
    });

    it('should accept empty update object', () => {
      const result = projectUpdateSchema.safeParse({});

      expect(result.success).toBe(true);
    });
  });
});
