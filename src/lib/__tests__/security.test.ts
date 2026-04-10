/**
 * ALGO Security Tests
 * Unit tests for input sanitization and validation
 */

import { describe, it, expect } from 'vitest'
import { 
  escapeHtml,
  sanitizeInput,
  sanitizeObject,
  checkRateLimit,
  generateCsrfToken,
  validateCsrfToken,
  validators,
} from '@/lib/security'

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    expect(escapeHtml('alert("xss")')).toBe('alert(&quot;xss&quot;)')
    expect(escapeHtml("it's & it's")).toBe("it&#x27;s &amp; it&#x27;s")
  })

  it('should handle empty and non-string inputs', () => {
    expect(escapeHtml('')).toBe('')
    expect(escapeHtml(null as unknown as string)).toBe('')
    expect(escapeHtml(undefined as unknown as string)).toBe('')
  })

  it('should leave safe strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
    expect(escapeHtml('123')).toBe('123')
  })
})

describe('sanitizeInput', () => {
  it('should remove script tags', () => {
    const input = '<script>alert("xss")</script>Hello'
    expect(sanitizeInput(input)).not.toContain('<script>')
    expect(sanitizeInput(input)).not.toContain('alert')
  })

  it('should remove event handlers', () => {
    expect(sanitizeInput('<div onclick="alert(1)">test</div>')).not.toContain('onclick')
    expect(sanitizeInput('<img onerror="alert(1)">')).not.toContain('onerror')
  })

  it('should remove javascript: URLs', () => {
    expect(sanitizeInput('javascript:alert(1)')).not.toContain('javascript:')
  })

  it('should handle normal text', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World')
  })
})

describe('sanitizeObject', () => {
  it('should sanitize string values in objects', () => {
    const input = {
      name: '<script>alert(1)</script>John',
      age: 30,
    }
    const result = sanitizeObject(input)
    expect(result.name).not.toContain('<script>')
    expect(result.age).toBe(30)
  })

  it('should handle nested objects', () => {
    const input = {
      user: {
        name: '<script>alert(1)</script>',
      },
    }
    const result = sanitizeObject(input)
    expect(result.user.name).not.toContain('<script>')
  })
})

describe('checkRateLimit', () => {
  it('should allow requests within limit', () => {
    const key = 'test-user-' + Date.now()
    const result = checkRateLimit(key, { maxRequests: 10, windowMs: 60000 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('should block requests over limit', () => {
    const key = 'test-block-' + Date.now()
    
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, { maxRequests: 5, windowMs: 60000 })
    }
    
    // 6th request should be blocked
    const result = checkRateLimit(key, { maxRequests: 5, windowMs: 60000 })
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
})

describe('CSRF Protection', () => {
  it('should generate valid CSRF tokens', () => {
    const token = generateCsrfToken()
    expect(token).toHaveLength(64) // 32 bytes = 64 hex chars
    expect(/^[a-f0-9]+$/i.test(token)).toBe(true)
  })

  it('should validate matching tokens', () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(token, token)).toBe(true)
  })

  it('should reject non-matching tokens', () => {
    const token1 = generateCsrfToken()
    const token2 = generateCsrfToken()
    expect(validateCsrfToken(token1, token2)).toBe(false)
  })

  it('should reject empty tokens', () => {
    expect(validateCsrfToken('', '')).toBe(false)
    expect(validateCsrfToken(null as unknown as string, 'token')).toBe(false)
  })
})

describe('Input Validators', () => {
  describe('email', () => {
    it('should validate correct emails', () => {
      expect(validators.email('test@example.com')).toBe(true)
      expect(validators.email('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validators.email('notanemail')).toBe(false)
      expect(validators.email('test@')).toBe(false)
      expect(validators.email('@domain.com')).toBe(false)
    })
  })

  describe('username', () => {
    it('should validate correct usernames', () => {
      expect(validators.username('john_doe123')).toBe(true)
      expect(validators.username('user-name')).toBe(true)
    })

    it('should reject invalid usernames', () => {
      expect(validators.username('ab')).toBe(false) // too short
      expect(validators.username('user name')).toBe(false) // space
      expect(validators.username('user@name')).toBe(false) // special char
    })
  })

  describe('url', () => {
    it('should validate correct URLs', () => {
      expect(validators.url('https://example.com')).toBe(true)
      expect(validators.url('http://localhost:3000')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(validators.url('not-a-url')).toBe(false)
      expect(validators.url('ftp://example.com')).toBe(false)
    })
  })

  describe('uuid', () => {
    it('should validate correct UUIDs', () => {
      expect(validators.uuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      expect(validators.uuid('not-a-uuid')).toBe(false)
      expect(validators.uuid('550e8400-e29b-41d4-a716')).toBe(false)
    })
  })
})
