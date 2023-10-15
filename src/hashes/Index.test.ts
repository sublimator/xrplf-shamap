import { describe, expect, it, beforeEach } from '@jest/globals'

import { Index } from './Index' // Adjust the import path accordingly

describe('Index class', () => {
  let buffer: Uint8Array
  let index: Index

  beforeEach(() => {
    buffer = new Uint8Array([0xab, 0xcd, 0xef])
    index = new Index(buffer, 6) // Length is 6 as there are 3 bytes * 2 nibbles/byte
  })

  it('should create Index instance with correct buffer and length', () => {
    expect(index.buffer).toBe(buffer)
    expect(index.nibbles).toBe(6)
  })

  it('should return correct nibble value', () => {
    expect(index.nibble(0)).toBe(0xa) // First nibble of first byte
    expect(index.nibble(1)).toBe(0xb) // Second nibble of first byte
    expect(index.nibble(4)).toBe(0xe) // First nibble of third byte
    expect(index.nibble(5)).toBe(0xf) // Second nibble of third byte
  })

  it('should throw error for out-of-bounds index', () => {
    expect(() => index.nibble(6)).toThrowError('indexing out of bounds, 6[6]')
    expect(() => index.nibble(7)).toThrowError('indexing out of bounds, 6[7]')
  })

  const lengthThrees = ['ABC', [0xa, 0x0b, 0xc]]
  describe.each(lengthThrees)('Index class with length of 3 %s', val => {
    let index: Index

    beforeEach(() => {
      index = Index.fromNibbles(val) // Length is 3 indicating 1 full byte and 1 nibble are valid
    })

    it('should create Index instance with correct length', () => {
      expect(index.nibbles).toBe(3)
    })

    it('should return correct nibble value', () => {
      expect(index.nibble(0)).toBe(0xa) // First nibble of first byte

      expect(index.nibble(1)).toBe(0xb) // Second nibble of first byte

      expect(index.nibble(2)).toBe(0xc) // First nibble of second byte
    })

    it('should throw error for out-of-bounds index', () => {
      expect(() => index.nibble(3)).toThrowError('indexing out of bounds, 3[3]')
      expect(() => index.nibble(4)).toThrowError('indexing out of bounds, 3[4]')
    })
  })
})
