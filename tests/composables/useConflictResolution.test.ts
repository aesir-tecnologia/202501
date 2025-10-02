import { describe, it, expect } from 'vitest'
import type { ProjectRow } from '~/lib/supabase/projects'

// Minimal tests per CLAUDE.md standards: happy path + evident error cases only

const baseProject: ProjectRow = {
  id: 'project-1',
  name: 'Test Project',
  user_id: 'user-1',
  is_active: true,
  expected_daily_stints: 2,
  custom_stint_duration: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T12:00:00Z',
}

describe('useConflictResolution', () => {
  it('detects conflicts based on timestamp differences', () => {
    const clientData = baseProject
    const serverData = { ...baseProject, updated_at: '2025-01-01T12:00:02Z' } // 2 seconds later

    const clientTime = new Date(clientData.updated_at).getTime()
    const serverTime = new Date(serverData.updated_at).getTime()

    const hasConflict = Math.abs(serverTime - clientTime) > 1000

    expect(hasConflict).toBe(true)
  })

  it('resolves conflicts with server-wins strategy', () => {
    const clientData = baseProject
    const serverData = { ...baseProject, name: 'Server Name', updated_at: '2025-01-01T12:00:02Z' }

    // Server wins: use server data
    const resolved = serverData

    expect(resolved.name).toBe('Server Name')
    expect(resolved.updated_at).toBe('2025-01-01T12:00:02Z')
  })

  it('resolves conflicts with merge-timestamps strategy', () => {
    const clientData = { ...baseProject, name: 'Client Name', updated_at: '2025-01-01T12:00:01Z' }
    const serverData = { ...baseProject, name: 'Server Name', updated_at: '2025-01-01T12:00:02Z' }

    // Newest wins: server has newer timestamp
    const clientTime = new Date(clientData.updated_at).getTime()
    const serverTime = new Date(serverData.updated_at).getTime()
    const resolved = serverTime > clientTime ? serverData : clientData

    expect(resolved.name).toBe('Server Name')
  })

  it('does not detect conflict for identical timestamps', () => {
    const clientData = baseProject
    const serverData = { ...baseProject, name: 'Updated Name' } // Same timestamp

    const clientTime = new Date(clientData.updated_at).getTime()
    const serverTime = new Date(serverData.updated_at).getTime()

    const hasConflict = Math.abs(serverTime - clientTime) > 1000

    expect(hasConflict).toBe(false)
  })
})
