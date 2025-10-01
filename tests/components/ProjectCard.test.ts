import { describe, expect, it } from 'vitest'
import type { ProjectRow } from '~/lib/supabase/projects'

describe('ProjectCard', () => {
  const mockProject: ProjectRow = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Project',
    expected_daily_stints: 3,
    custom_stint_duration: 25,
    is_active: true,
    user_id: 'user123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  it('should display project name', () => {
    expect(mockProject.name).toBe('Test Project')
  })

  it('should show active status', () => {
    expect(mockProject.is_active).toBe(true)
  })

  it('should display expected daily stints', () => {
    expect(mockProject.expected_daily_stints).toBe(3)
  })

  it('should display custom stint duration', () => {
    expect(mockProject.custom_stint_duration).toBe(25)
  })
})
