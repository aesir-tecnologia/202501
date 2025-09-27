import { vi } from 'vitest'

// Mock environment variables for tests
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key'

// Global test setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
})

// Mock File constructor for Node.js environment
global.File = class MockFile {
  public name: string
  public type: string
  public size: number
  public lastModified: number

  constructor(bits: BlobPart[], filename: string, options: FilePropertyBag = {}) {
    this.name = filename
    this.type = options.type || ''
    this.size = bits.reduce((size, bit) => {
      if (typeof bit === 'string') return size + bit.length
      if (bit instanceof ArrayBuffer) return size + bit.byteLength
      return size + (bit as ArrayLike<unknown>).length || 0
    }, 0)
    this.lastModified = options.lastModified || Date.now()
  }
} as typeof globalThis.File
