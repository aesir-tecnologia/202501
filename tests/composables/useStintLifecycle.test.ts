import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStintLifecycle } from '~/composables/useStintLifecycle'
import * as stintsDb from '~/lib/supabase/stints'
import type { StintRow } from '~/lib/supabase/stints'
import type { TypedSupabaseClient } from '~/utils/supabase'
import { ref, type Ref } from 'vue'

const mockClient = {} as TypedSupabaseClient

// Use valid UUIDs for testing
const PROJECT_ID = '00000000-0000-0000-0000-000000000001'
const STINT_ID = '00000000-0000-0000-0000-000000000010'
const USER_ID = '00000000-0000-0000-0000-000000000100'

const baseStint: StintRow = {
  id: STINT_ID,
  project_id: PROJECT_ID,
  user_id: USER_ID,
  started_at: '2025-01-01T10:00:00Z',
  ended_at: null,
  duration_minutes: null,
  notes: null,
  is_completed: false,
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-01T10:00:00Z',
}

describe('useStintLifecycle', () => {
  let mockStints: Ref<StintRow[]>
  let mockActiveStint: Ref<StintRow | null>

  beforeEach(() => {
    vi.clearAllMocks()
    mockStints = ref([])
    mockActiveStint = ref(null)
  })

  describe('startStint', () => {
    it('starts stint with optimistic update and replaces with server data', async () => {
      const { startStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      vi.spyOn(stintsDb, 'startStint').mockImplementation(async () => ({
        data: baseStint,
        error: null,
      } as any))

      const result = await startStint({ projectId: PROJECT_ID })

      expect(result.data).toEqual(baseStint)
      expect(result.error).toBeNull()
      expect(mockStints.value).toHaveLength(1)
      expect(mockStints.value[0]).toEqual(baseStint)
      expect(mockActiveStint.value).toEqual(baseStint)
    })

    it('rolls back optimistic update on database error', async () => {
      const { startStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      vi.spyOn(stintsDb, 'startStint').mockImplementation(async () => ({
        data: null,
        error: new Error('Database error'),
      } as any))

      const result = await startStint({ projectId: PROJECT_ID })

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
      expect(mockStints.value).toHaveLength(0)
      expect(mockActiveStint.value).toBeNull()
    })

    it('validates input before creating stint', async () => {
      const { startStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      const result = await startStint({ projectId: 'invalid-uuid' })

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
      expect(mockStints.value).toHaveLength(0)
    })
  })

  describe('stopStint', () => {
    it('stops stint with optimistic update', async () => {
      const activeStint = { ...baseStint }
      mockStints.value = [activeStint]
      mockActiveStint.value = activeStint

      const completedStint: StintRow = {
        ...activeStint,
        ended_at: '2025-01-01T11:00:00Z',
        duration_minutes: 60,
        is_completed: true,
      }

      const { stopStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      vi.spyOn(stintsDb, 'stopStint').mockImplementation(async () => ({
        data: completedStint,
        error: null,
      } as any))

      const result = await stopStint(STINT_ID)

      expect(result.data).toEqual(completedStint)
      expect(result.error).toBeNull()
      expect(mockStints.value[0].is_completed).toBe(true)
      expect(mockActiveStint.value).toBeNull()
    })

    it('rolls back on database error', async () => {
      const activeStint = { ...baseStint }
      mockStints.value = [activeStint]
      mockActiveStint.value = activeStint

      const { stopStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      vi.spyOn(stintsDb, 'stopStint').mockImplementation(async () => ({
        data: null,
        error: new Error('Database error'),
      } as any))

      const result = await stopStint(STINT_ID)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
      expect(mockStints.value[0].is_completed).toBe(false)
      expect(mockActiveStint.value).toEqual(activeStint)
    })

    it('validates duration constraints', async () => {
      const activeStint = { ...baseStint }
      mockStints.value = [activeStint]

      const { stopStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      // Duration less than 5 minutes - requires valid UUID for validation
      const result = await stopStint(baseStint.id, { durationMinutes: 3 })

      expect(result.data).toBeNull()
      expect(result.error?.message).toContain('at least')
    })
  })

  describe('pauseStint', () => {
    it('pauses stint with optimistic update', async () => {
      const activeStint = { ...baseStint }
      mockStints.value = [activeStint]
      mockActiveStint.value = activeStint

      const pausedStint: StintRow = {
        ...activeStint,
        ended_at: '2025-01-01T10:30:00Z',
        duration_minutes: 30,
      }

      const { pauseStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      vi.spyOn(stintsDb, 'pauseStint').mockImplementation(async () => ({
        data: pausedStint,
        error: null,
      } as any))

      const result = await pauseStint(STINT_ID)

      expect(result.data).toEqual(pausedStint)
      expect(result.error).toBeNull()
      expect(mockStints.value[0].ended_at).toBeTruthy()
      expect(mockStints.value[0].is_completed).toBe(false)
      expect(mockActiveStint.value).toBeNull()
    })

    it('rolls back on database error', async () => {
      const activeStint = { ...baseStint }
      mockStints.value = [activeStint]
      mockActiveStint.value = activeStint

      const { pauseStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      vi.spyOn(stintsDb, 'pauseStint').mockImplementation(async () => ({
        data: null,
        error: new Error('Database error'),
      } as any))

      const result = await pauseStint(STINT_ID)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
      expect(mockStints.value[0].ended_at).toBeNull()
      expect(mockActiveStint.value).toEqual(activeStint)
    })
  })

  describe('resumeStint', () => {
    it('resumes paused stint with optimistic update', async () => {
      const pausedStint: StintRow = {
        ...baseStint,
        ended_at: '2025-01-01T10:30:00Z',
        duration_minutes: 30,
        is_completed: false,
      }
      mockStints.value = [pausedStint]

      const newActiveStint: StintRow = {
        id: '00000000-0000-0000-0000-000000000012',
        project_id: PROJECT_ID,
        user_id: USER_ID,
        started_at: '2025-01-01T11:00:00Z',
        ended_at: null,
        duration_minutes: null,
        notes: null,
        is_completed: false,
        created_at: '2025-01-01T11:00:00Z',
        updated_at: '2025-01-01T11:00:00Z',
      }

      const { resumeStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      vi.spyOn(stintsDb, 'resumeStint').mockImplementation(async () => ({
        data: newActiveStint,
        error: null,
      } as any))

      const result = await resumeStint(STINT_ID)

      expect(result.data).toEqual(newActiveStint)
      expect(result.error).toBeNull()
      expect(mockStints.value).toHaveLength(2)
      expect(mockActiveStint.value).toEqual(newActiveStint)
    })

    it('rolls back on database error', async () => {
      const pausedStint: StintRow = {
        ...baseStint,
        ended_at: '2025-01-01T10:30:00Z',
        duration_minutes: 30,
        is_completed: false,
      }
      mockStints.value = [pausedStint]

      const { resumeStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      vi.spyOn(stintsDb, 'resumeStint').mockImplementation(async () => ({
        data: null,
        error: new Error('Database error'),
      } as any))

      const result = await resumeStint(STINT_ID)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
      expect(mockStints.value).toHaveLength(1)
      expect(mockActiveStint.value).toBeNull()
    })
  })

  describe('single-active constraint', () => {
    it('handles server stopping previous active stint on start', async () => {
      const previousActive: StintRow = {
        id: '00000000-0000-0000-0000-000000000011',
        project_id: PROJECT_ID,
        user_id: USER_ID,
        started_at: '2025-01-01T09:00:00Z',
        ended_at: null,
        duration_minutes: null,
        notes: null,
        is_completed: false,
        created_at: '2025-01-01T09:00:00Z',
        updated_at: '2025-01-01T09:00:00Z',
      }

      mockStints.value = [previousActive]
      mockActiveStint.value = previousActive

      const newActiveStint: StintRow = {
        id: STINT_ID,
        project_id: '00000000-0000-0000-0000-000000000002',
        user_id: USER_ID,
        started_at: '2025-01-01T10:00:00Z',
        ended_at: null,
        duration_minutes: null,
        notes: null,
        is_completed: false,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      }

      const { startStint } = useStintLifecycle(mockClient, mockStints, mockActiveStint)

      vi.spyOn(stintsDb, 'startStint').mockImplementation(async () => ({
        data: newActiveStint,
        error: null,
      } as any))

      const result = await startStint({ projectId: '00000000-0000-0000-0000-000000000002' })

      expect(result.data).toEqual(newActiveStint)
      expect(mockActiveStint.value).toEqual(newActiveStint)
    })
  })
})
