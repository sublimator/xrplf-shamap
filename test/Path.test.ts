import { beforeEach, describe, expect, it } from '@jest/globals'

import { Path } from '../src/indexes/Path'

describe('Path class', () => {
  let buffer: number[]
  let index: Path

  beforeEach(() => {
    buffer = [0xa, 0xb, 0xc, 0xd, 0xe, 0xf]
    index = new Path(buffer, 6)
  })

  it('should create Path instance with correct buffer and length', () => {
    expect(index.turns).toBe(buffer)
    expect(index.nibbles).toBe(6)
  })

  it('should return correct nibble value', () => {
    expect(index.nibble(0)).toBe(0xa)
    expect(index.nibble(1)).toBe(0xb)
    expect(index.nibble(4)).toBe(0xe)
    expect(index.nibble(5)).toBe(0xf)
  })

  it('should throw error for out-of-bounds index', () => {
    expect(() => index.nibble(6)).toThrowError('indexing out of bounds, 6[6]')
    expect(() => index.nibble(7)).toThrowError('indexing out of bounds, 6[7]')
  })

  const lengthThrees = [
    ['A', 'B', 'C'],
    [0xa, 0x0b, 0xc]
  ]
  describe.each(lengthThrees)('Path class with length of 3 %s', (...val) => {
    let index: Path

    beforeEach(() => {
      index = Path.from(val)
    })

    it('should create Path instance with correct length', () => {
      expect(index.nibbles).toBe(3)
    })

    it('should return correct nibble value', () => {
      expect(index.nibble(0)).toBe(0xa)

      expect(index.nibble(1)).toBe(0xb)

      expect(index.nibble(2)).toBe(0xc)
    })

    it('should throw error for out-of-bounds index', () => {
      expect(() => index.nibble(3)).toThrowError('indexing out of bounds, 3[3]')
      expect(() => index.nibble(4)).toThrowError('indexing out of bounds, 3[4]')
    })
  })
})
