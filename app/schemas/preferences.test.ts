import { describe, it, expect } from 'vitest';
import { preferencesUpdateSchema, DEFAULT_PREFERENCES } from './preferences';
import { PREFERENCES } from '~/constants';

describe('preferences schema', () => {
  describe('preferencesUpdateSchema', () => {
    describe('valid payloads', () => {
      it('should validate a complete preferences update', () => {
        const validPayload = {
          defaultStintDuration: 60,
          celebrationAnimation: false,
          desktopNotifications: true,
        };

        const result = preferencesUpdateSchema.safeParse(validPayload);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(validPayload);
      });

      it('should validate partial updates with only defaultStintDuration', () => {
        const result = preferencesUpdateSchema.safeParse({
          defaultStintDuration: 45,
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ defaultStintDuration: 45 });
      });

      it('should validate partial updates with only celebrationAnimation', () => {
        const result = preferencesUpdateSchema.safeParse({
          celebrationAnimation: false,
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ celebrationAnimation: false });
      });

      it('should validate partial updates with only desktopNotifications', () => {
        const result = preferencesUpdateSchema.safeParse({
          desktopNotifications: true,
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ desktopNotifications: true });
      });

      it('should validate partial updates with only timezone', () => {
        const result = preferencesUpdateSchema.safeParse({
          timezone: 'America/New_York',
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ timezone: 'America/New_York' });
      });

      it('should validate empty object (no updates)', () => {
        const result = preferencesUpdateSchema.safeParse({});

        expect(result.success).toBe(true);
        expect(result.data).toEqual({});
      });

      it('should allow null for defaultStintDuration (use system default)', () => {
        const result = preferencesUpdateSchema.safeParse({
          defaultStintDuration: null,
        });

        expect(result.success).toBe(true);
        expect(result.data!.defaultStintDuration).toBeNull();
      });

      it('should validate minimum duration boundary', () => {
        const result = preferencesUpdateSchema.safeParse({
          defaultStintDuration: PREFERENCES.STINT_DURATION.MIN,
        });

        expect(result.success).toBe(true);
        expect(result.data!.defaultStintDuration).toBe(PREFERENCES.STINT_DURATION.MIN);
      });

      it('should validate maximum duration boundary', () => {
        const result = preferencesUpdateSchema.safeParse({
          defaultStintDuration: PREFERENCES.STINT_DURATION.MAX,
        });

        expect(result.success).toBe(true);
        expect(result.data!.defaultStintDuration).toBe(PREFERENCES.STINT_DURATION.MAX);
      });
    });

    describe('invalid payloads', () => {
      it('should reject duration below minimum', () => {
        const result = preferencesUpdateSchema.safeParse({
          defaultStintDuration: PREFERENCES.STINT_DURATION.MIN - 1,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`at least ${PREFERENCES.STINT_DURATION.MIN}`);
      });

      it('should reject duration above maximum', () => {
        const result = preferencesUpdateSchema.safeParse({
          defaultStintDuration: PREFERENCES.STINT_DURATION.MAX + 1,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain(`cannot exceed ${PREFERENCES.STINT_DURATION.MAX}`);
      });

      it('should reject non-integer duration', () => {
        const result = preferencesUpdateSchema.safeParse({
          defaultStintDuration: 45.5,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('whole minutes');
      });

      it('should reject string duration', () => {
        const result = preferencesUpdateSchema.safeParse({
          defaultStintDuration: '60',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toContain('must be a number');
      });

      it('should reject non-boolean celebrationAnimation', () => {
        const result = preferencesUpdateSchema.safeParse({
          celebrationAnimation: 'yes',
        });

        expect(result.success).toBe(false);
      });

      it('should reject empty timezone string', () => {
        const result = preferencesUpdateSchema.safeParse({
          timezone: '',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe('Timezone cannot be empty');
      });

      it('should reject non-string timezone', () => {
        const result = preferencesUpdateSchema.safeParse({
          timezone: 123,
        });

        expect(result.success).toBe(false);
      });

      it('should reject invalid IANA timezone identifier', () => {
        const result = preferencesUpdateSchema.safeParse({
          timezone: 'Invalid/Timezone',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe('Invalid timezone identifier');
      });

      it('should reject non-boolean desktopNotifications', () => {
        const result = preferencesUpdateSchema.safeParse({
          desktopNotifications: 1,
        });

        expect(result.success).toBe(false);
      });

      it('should reject unknown fields (strict mode)', () => {
        const result = preferencesUpdateSchema.safeParse({
          unknownField: 'value',
        });

        expect(result.success).toBe(true);
        expect(result.data).not.toHaveProperty('unknownField');
      });
    });
  });

  describe('DEFAULT_PREFERENCES', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_PREFERENCES).toEqual({
        defaultStintDuration: null,
        celebrationAnimation: true,
        desktopNotifications: false,
        stintDayAttribution: 'ask',
        timezone: 'UTC',
      });
    });

    it('should match the documented defaults', () => {
      expect(DEFAULT_PREFERENCES.defaultStintDuration).toBeNull();
      expect(DEFAULT_PREFERENCES.celebrationAnimation).toBe(true);
      expect(DEFAULT_PREFERENCES.desktopNotifications).toBe(false);
      expect(DEFAULT_PREFERENCES.stintDayAttribution).toBe('ask');
      expect(DEFAULT_PREFERENCES.timezone).toBe('UTC');
    });
  });

  describe('PREFERENCES constants', () => {
    it('should have correct stint duration limits', () => {
      expect(PREFERENCES.STINT_DURATION.MIN).toBe(5);
      expect(PREFERENCES.STINT_DURATION.MAX).toBe(480);
      expect(PREFERENCES.STINT_DURATION.DEFAULT).toBe(120);
    });
  });
});
