import { describe, it, expect } from 'vitest';
import {
  projectIdentifierSchema,
  projectCreateSchema,
  projectUpdateSchema,
  projectListFiltersSchema,
} from './projects';
import { PROJECT } from '~/constants';

describe('projects schema', () => {
  describe('projectIdentifierSchema', () => {
    it('should validate a valid UUID', () => {
      const result = projectIdentifierSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reject an invalid UUID', () => {
      const result = projectIdentifierSchema.safeParse({
        id: 'not-a-uuid',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing id', () => {
      const result = projectIdentifierSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  describe('projectCreateSchema', () => {
    describe('valid payloads', () => {
      it('should validate a minimal project with just name', () => {
        const result = projectCreateSchema.safeParse({
          name: 'My Project',
        });

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe('My Project');
        expect(result.data?.expectedDailyStints).toBe(PROJECT.DAILY_STINTS.DEFAULT);
      });

      it('should validate a complete project payload', () => {
        const validPayload = {
          name: 'Client Project',
          expectedDailyStints: 4,
          customStintDuration: 90,
          colorTag: 'blue' as const,
          isActive: true,
        };

        const result = projectCreateSchema.safeParse(validPayload);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(validPayload);
      });

      it('should trim whitespace from name', () => {
        const result = projectCreateSchema.safeParse({
          name: '  Trimmed Name  ',
        });

        expect(result.success).toBe(true);
        expect(result.data?.name).toBe('Trimmed Name');
      });

      it('should allow null for customStintDuration', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          customStintDuration: null,
        });

        expect(result.success).toBe(true);
        expect(result.data?.customStintDuration).toBeNull();
      });

      it('should allow null for colorTag', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          colorTag: null,
        });

        expect(result.success).toBe(true);
        expect(result.data?.colorTag).toBeNull();
      });

      describe('name boundaries', () => {
        it('should accept minimum length name', () => {
          const result = projectCreateSchema.safeParse({
            name: 'AB',
          });

          expect(result.success).toBe(true);
          expect(result.data?.name).toBe('AB');
        });

        it('should accept maximum length name', () => {
          const maxName = 'A'.repeat(PROJECT.NAME.MAX_LENGTH);
          const result = projectCreateSchema.safeParse({
            name: maxName,
          });

          expect(result.success).toBe(true);
          expect(result.data?.name).toBe(maxName);
        });
      });

      describe('expectedDailyStints boundaries', () => {
        it('should accept minimum daily stints', () => {
          const result = projectCreateSchema.safeParse({
            name: 'Project',
            expectedDailyStints: PROJECT.DAILY_STINTS.MIN,
          });

          expect(result.success).toBe(true);
          expect(result.data?.expectedDailyStints).toBe(PROJECT.DAILY_STINTS.MIN);
        });

        it('should accept maximum daily stints', () => {
          const result = projectCreateSchema.safeParse({
            name: 'Project',
            expectedDailyStints: PROJECT.DAILY_STINTS.MAX,
          });

          expect(result.success).toBe(true);
          expect(result.data?.expectedDailyStints).toBe(PROJECT.DAILY_STINTS.MAX);
        });
      });

      describe('customStintDuration boundaries', () => {
        it('should accept minimum duration', () => {
          const result = projectCreateSchema.safeParse({
            name: 'Project',
            customStintDuration: PROJECT.CUSTOM_STINT_DURATION_MINUTES.MIN,
          });

          expect(result.success).toBe(true);
          expect(result.data?.customStintDuration).toBe(PROJECT.CUSTOM_STINT_DURATION_MINUTES.MIN);
        });

        it('should accept maximum duration', () => {
          const result = projectCreateSchema.safeParse({
            name: 'Project',
            customStintDuration: PROJECT.CUSTOM_STINT_DURATION_MINUTES.MAX,
          });

          expect(result.success).toBe(true);
          expect(result.data?.customStintDuration).toBe(PROJECT.CUSTOM_STINT_DURATION_MINUTES.MAX);
        });
      });

      describe('colorTag values', () => {
        it.each(PROJECT.COLORS)('should accept color: %s', (color) => {
          const result = projectCreateSchema.safeParse({
            name: 'Project',
            colorTag: color,
          });

          expect(result.success).toBe(true);
          expect(result.data?.colorTag).toBe(color);
        });
      });
    });

    describe('invalid payloads', () => {
      it('should reject missing name', () => {
        const result = projectCreateSchema.safeParse({
          expectedDailyStints: 3,
        });

        expect(result.success).toBe(false);
      });

      it('should reject name below minimum length', () => {
        const result = projectCreateSchema.safeParse({
          name: 'A',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`at least ${PROJECT.NAME.MIN_LENGTH}`);
      });

      it('should reject name above maximum length', () => {
        const result = projectCreateSchema.safeParse({
          name: 'A'.repeat(PROJECT.NAME.MAX_LENGTH + 1),
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`${PROJECT.NAME.MAX_LENGTH} characters or fewer`);
      });

      it('should reject whitespace-only name', () => {
        const result = projectCreateSchema.safeParse({
          name: '   ',
        });

        expect(result.success).toBe(false);
      });

      it('should reject expectedDailyStints below minimum', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          expectedDailyStints: PROJECT.DAILY_STINTS.MIN - 1,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`at least ${PROJECT.DAILY_STINTS.MIN}`);
      });

      it('should reject expectedDailyStints above maximum', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          expectedDailyStints: PROJECT.DAILY_STINTS.MAX + 1,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`cannot exceed ${PROJECT.DAILY_STINTS.MAX}`);
      });

      it('should reject non-integer expectedDailyStints', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          expectedDailyStints: 2.5,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('whole number');
      });

      it('should reject string expectedDailyStints', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          expectedDailyStints: '3',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('must be a number');
      });

      it('should reject customStintDuration below minimum', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          customStintDuration: PROJECT.CUSTOM_STINT_DURATION_MINUTES.MIN - 1,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`at least ${PROJECT.CUSTOM_STINT_DURATION_MINUTES.MIN}`);
      });

      it('should reject customStintDuration above maximum', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          customStintDuration: PROJECT.CUSTOM_STINT_DURATION_MINUTES.MAX + 1,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`cannot exceed ${PROJECT.CUSTOM_STINT_DURATION_MINUTES.MAX}`);
      });

      it('should reject non-integer customStintDuration', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          customStintDuration: 45.5,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('whole minutes');
      });

      it('should reject string customStintDuration', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          customStintDuration: '60',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('must be a number');
      });

      it('should reject invalid colorTag', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          colorTag: 'rainbow',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('Invalid color');
      });

      it('should reject non-boolean isActive', () => {
        const result = projectCreateSchema.safeParse({
          name: 'Project',
          isActive: 'yes',
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('projectUpdateSchema', () => {
    describe('valid payloads', () => {
      it('should validate empty object (no updates)', () => {
        const result = projectUpdateSchema.safeParse({});

        expect(result.success).toBe(true);
        expect(result.data).toEqual({});
      });

      it('should validate partial update with only name', () => {
        const result = projectUpdateSchema.safeParse({
          name: 'Updated Name',
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ name: 'Updated Name' });
      });

      it('should validate partial update with only expectedDailyStints', () => {
        const result = projectUpdateSchema.safeParse({
          expectedDailyStints: 5,
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ expectedDailyStints: 5 });
      });

      it('should validate partial update with only customStintDuration', () => {
        const result = projectUpdateSchema.safeParse({
          customStintDuration: 90,
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ customStintDuration: 90 });
      });

      it('should validate partial update with only colorTag', () => {
        const result = projectUpdateSchema.safeParse({
          colorTag: 'green',
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ colorTag: 'green' });
      });

      it('should validate partial update with only isActive', () => {
        const result = projectUpdateSchema.safeParse({
          isActive: false,
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ isActive: false });
      });

      it('should validate full update payload', () => {
        const fullUpdate = {
          name: 'New Name',
          expectedDailyStints: 3,
          customStintDuration: 60,
          colorTag: 'purple' as const,
          isActive: true,
        };

        const result = projectUpdateSchema.safeParse(fullUpdate);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(fullUpdate);
      });

      it('should allow setting customStintDuration to null', () => {
        const result = projectUpdateSchema.safeParse({
          customStintDuration: null,
        });

        expect(result.success).toBe(true);
        expect(result.data?.customStintDuration).toBeNull();
      });

      it('should allow setting colorTag to null', () => {
        const result = projectUpdateSchema.safeParse({
          colorTag: null,
        });

        expect(result.success).toBe(true);
        expect(result.data?.colorTag).toBeNull();
      });
    });

    describe('invalid payloads', () => {
      it('should reject invalid name in update', () => {
        const result = projectUpdateSchema.safeParse({
          name: 'A',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`at least ${PROJECT.NAME.MIN_LENGTH}`);
      });

      it('should reject invalid expectedDailyStints in update', () => {
        const result = projectUpdateSchema.safeParse({
          expectedDailyStints: 0,
        });

        expect(result.success).toBe(false);
      });

      it('should reject invalid customStintDuration in update', () => {
        const result = projectUpdateSchema.safeParse({
          customStintDuration: 1000,
        });

        expect(result.success).toBe(false);
      });

      it('should reject invalid colorTag in update', () => {
        const result = projectUpdateSchema.safeParse({
          colorTag: 'invalid',
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('projectListFiltersSchema', () => {
    it('should validate empty filters', () => {
      const result = projectListFiltersSchema.safeParse({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should validate includeInactive: true', () => {
      const result = projectListFiltersSchema.safeParse({
        includeInactive: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.includeInactive).toBe(true);
    });

    it('should validate includeInactive: false', () => {
      const result = projectListFiltersSchema.safeParse({
        includeInactive: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.includeInactive).toBe(false);
    });

    it('should reject non-boolean includeInactive', () => {
      const result = projectListFiltersSchema.safeParse({
        includeInactive: 'yes',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('PROJECT constants', () => {
    it('should have correct name length limits', () => {
      expect(PROJECT.NAME.MIN_LENGTH).toBe(2);
      expect(PROJECT.NAME.MAX_LENGTH).toBe(60);
    });

    it('should have correct daily stints limits', () => {
      expect(PROJECT.DAILY_STINTS.MIN).toBe(1);
      expect(PROJECT.DAILY_STINTS.MAX).toBe(12);
      expect(PROJECT.DAILY_STINTS.DEFAULT).toBe(2);
    });

    it('should have correct custom stint duration limits', () => {
      expect(PROJECT.CUSTOM_STINT_DURATION_MINUTES.MIN).toBe(5);
      expect(PROJECT.CUSTOM_STINT_DURATION_MINUTES.MAX).toBe(480);
    });

    it('should have valid color options', () => {
      expect(PROJECT.COLORS).toContain('red');
      expect(PROJECT.COLORS).toContain('blue');
      expect(PROJECT.COLORS).toContain('green');
      expect(PROJECT.COLORS.length).toBe(8);
    });
  });
});
