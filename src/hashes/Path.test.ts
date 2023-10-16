import { describe, expect, it, beforeEach } from '@jest/globals'

import { Path } from './Path' // Adjust the import path accordingly

describe('Path class', () => {
  let buffer: number[]
  let index: Path

  beforeEach(() => {
    buffer = [0xa, 0xb, 0xc, 0xd, 0xe, 0xf]
    index = new Path(buffer, 6) // Length is 6 as there are 3 bytes * 2 nibbles/byte
  })

  it('should create Path instance with correct buffer and length', () => {
    expect(index.turns).toBe(buffer)
    expect(index.nibbles).toBe(6)
  })

  it('should return correct nibble value', () => {
    expect(index.nibblet(0)).toBe(0xa) // First nibble of first byte
    expect(index.nibblet(1)).toBe(0xb) // Second nibble of first byte
    expect(index.nibblet(4)).toBe(0xe) // First nibble of third byte
    expect(index.nibblet(5)).toBe(0xf) // Second nibble of third byte
  })

  it('should throw error for out-of-bounds index', () => {
    expect(() => index.nibblet(6)).toThrowError('indexing out of bounds, 6[6]')
    expect(() => index.nibblet(7)).toThrowError('indexing out of bounds, 6[7]')
  })

  const lengthThrees = ['ABC', [0xa, 0x0b, 0xc]]
  describe.each(lengthThrees)('Path class with length of 3 %s', val => {
    let index: Path

    beforeEach(() => {
      index = Path.from(val) // Length is 3 indicating 1 full byte and 1 nibble are valid
    })

    it('should create Path instance with correct length', () => {
      expect(index.nibbles).toBe(3)
    })

    it('should return correct nibble value', () => {
      expect(index.nibblet(0)).toBe(0xa) // First nibble of first byte

      expect(index.nibblet(1)).toBe(0xb) // Second nibble of first byte

      expect(index.nibblet(2)).toBe(0xc) // First nibble of second byte
    })

    it('should throw error for out-of-bounds index', () => {
      expect(() => index.nibblet(3)).toThrowError('indexing out of bounds, 3[3]')
      expect(() => index.nibblet(4)).toThrowError('indexing out of bounds, 3[4]')
    })
  })
})
