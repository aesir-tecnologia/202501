import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useStints } from '~/composables/useStints'
import type { StintRow } from '~/lib/supabase/stints'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
  useState: vi.fn((key, init) => ref(init?.())),
  useSupabaseClient: vi.fn(),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
}))

// Mock composables
vi.mock('~/composables/useStintLifecycle', () => ({
  useStintLifecycle: vi.fn(() => ({
    startStint: vi.fn(() => Promise.resolve({ data: null, error: new Error('Mock error') })),
    stopStint: vi.fn(() => Promise.resolve({ data: null, error: null })),
    pauseStint: vi.fn(() => Promise.resolve({ data: null, error: null })),
    resumeStint: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}))

describe('useStints', () => {
  let mockClient: any
  let stintsState: any
  let activeStintState: any

  beforeEach(() => {
    // Mock Supabase client
    mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              then: vi.fn(),
            })),
          })),
        })),
      })),
      channel: vi.fn(() => ({
        on: vi.fn(() => ({
          subscribe: vi.fn(),
        })),
      })),
      removeChannel: vi.fn(),
    }

    // Create fresh state refs for each test
    stintsState = ref<StintRow[]>([])
    activeStintState = ref<StintRow | null>(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty state', () => {
    const { stints, activeStint, isLoading, error } = useStints(
      mockClient,
      stintsState,
      activeStintState,
    )

    expect(stints.value).toEqual([])
    expect(activeStint.value).toBeNull()
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('provides timer state and formatted time', () => {
    const { elapsedSeconds, formattedTime, isTimerRunning } = useStints(
      mockClient,
      stintsState,
      activeStintState,
    )

    expect(elapsedSeconds.value).toBe(0)
    expect(formattedTime.value).toBe('00:00:00')
    expect(isTimerRunning.value).toBe(false)
  })

  it('formats time correctly for different durations', () => {
    const { formattedTime } = useStints(
      mockClient,
      stintsState,
      activeStintState,
    )

    // Test initial state (0:00:00)
    expect(formattedTime.value).toBe('00:00:00')

    // Note: elapsedSeconds is readonly and managed internally by timer worker
    // Full time formatting test would require timer worker integration testing
  })

  it('filters completed stints correctly', () => {
    const mockStints: StintRow[] = [
      {
        id: '1',
        project_id: 'proj-1',
        user_id: 'user-1',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_minutes: 60,
        notes: null,
        is_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        project_id: 'proj-1',
        user_id: 'user-1',
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_minutes: null,
        notes: null,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    stintsState.value = mockStints

    const { completedStints } = useStints(
      mockClient,
      stintsState,
      activeStintState,
    )

    expect(completedStints.value).toHaveLength(1)
    expect(completedStints.value[0].id).toBe('1')
    expect(completedStints.value[0].is_completed).toBe(true)
  })

  it('finds stint by ID', () => {
    const mockStints: StintRow[] = [
      {
        id: 'stint-123',
        project_id: 'proj-1',
        user_id: 'user-1',
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_minutes: null,
        notes: null,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    stintsState.value = mockStints

    const { getStintById } = useStints(
      mockClient,
      stintsState,
      activeStintState,
    )

    const found = getStintById('stint-123')
    expect(found).toBeDefined()
    expect(found?.id).toBe('stint-123')

    const notFound = getStintById('nonexistent')
    expect(notFound).toBeUndefined()
  })

  it('resets state correctly', () => {
    const mockStints: StintRow[] = [
      {
        id: '1',
        project_id: 'proj-1',
        user_id: 'user-1',
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_minutes: null,
        notes: null,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    stintsState.value = mockStints
    activeStintState.value = mockStints[0]

    const { stints, activeStint, resetState } = useStints(
      mockClient,
      stintsState,
      activeStintState,
    )

    resetState()

    expect(stints.value).toEqual([])
    expect(activeStint.value).toBeNull()
  })

  it('stopActiveStint fails with no active stint', async () => {
    const { stopActiveStint, error } = useStints(
      mockClient,
      stintsState,
      activeStintState,
    )

    await stopActiveStint()

    expect(error.value).toBeDefined()
    expect(error.value?.message).toContain('No active stint')
  })

  it('pauseActiveStint fails with no active stint', async () => {
    const { pauseActiveStint, error } = useStints(
      mockClient,
      stintsState,
      activeStintState,
    )

    await pauseActiveStint()

    expect(error.value).toBeDefined()
    expect(error.value?.message).toContain('No active stint')
  })
})
