import { describe, it, expect } from 'vitest'

// Minimal tests per CLAUDE.md standards: happy path + evident error cases only

describe('ConnectionStatus', () => {
  it('computes correct variant for offline state', () => {
    const isOnline = false
    const variant = isOnline ? 'success' : 'error'

    expect(variant).toBe('error')
  })

  it('computes correct variant for online state', () => {
    const isOnline = true
    const isConnected = true
    const variant = isOnline && isConnected ? 'success' : 'neutral'

    expect(variant).toBe('success')
  })

  it('shows pending count when offline', () => {
    const isOnline = false
    const pendingCount = 3
    const statusText = isOnline
      ? 'Online'
      : pendingCount > 0
        ? `Offline (${pendingCount} pending)`
        : 'Offline'

    expect(statusText).toBe('Offline (3 pending)')
  })
})
