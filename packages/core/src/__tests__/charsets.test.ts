import { describe, it, expect } from 'vitest'
import { CHARSETS } from '../charsets.js'

describe('CHARSETS', () => {
  it('full charset has 95 printable ASCII characters', () => {
    expect(CHARSETS.full).toHaveLength(95)
    expect(CHARSETS.full[0]).toBe(' ')
    expect(CHARSETS.full[94]).toBe('~')
  })

  it('simple charset has 10 characters ordered by density', () => {
    expect(CHARSETS.simple).toHaveLength(10)
    expect(CHARSETS.simple[0]).toBe(' ')
    expect(CHARSETS.simple[9]).toBe('@')
  })

  it('blocks charset has 9 characters', () => {
    expect(CHARSETS.blocks).toHaveLength(9)
    expect(CHARSETS.blocks).toContain('█')
    expect(CHARSETS.blocks).toContain('░')
  })

  it('digits charset has space, dot, and 10 digit characters', () => {
    expect(CHARSETS.digits).toHaveLength(12)
    expect(CHARSETS.digits[0]).toBe(' ')
    expect(CHARSETS.digits[1]).toBe('.')
    expect(CHARSETS.digits[11]).toBe('9')
  })
})
