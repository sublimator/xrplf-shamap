import { IIndex } from '../types'
import { isString, isU8a } from '../utils/guards'
import { hexToBytes } from '@noble/hashes/utils'

export class Index implements IIndex {
  constructor(public readonly buffer: Readonly<Uint8Array>, public length: number) {
  }

  nibble(n: number): number {
    if (n + 1 > this.length) {
      throw new Error(`indexing out of bounds, ${this.length}[${n}]`)
    }

    const byteIx = Math.floor(n / 2)
    const nibbleIx = n % 2
    const byte = this.buffer[byteIx]
    return nibbleIx === 1 ? byte & 0x0F : (byte & 0xF0) >> 4
  }

  static fromNibbles(nibbles: Uint8Array, length: number): Index
  static fromNibbles(nibbles: string | number[]): Index
  static fromNibbles(nibbles: string | number[] | Uint8Array, length?: number) {

    if (isString(nibbles)) {
      const normalized = nibbles.length % 2 === 1 ? nibbles + '0' : nibbles
      return new Index(hexToBytes(normalized), nibbles.length)
    } else if (Array.isArray(nibbles)) {
      const normalized = nibbles.length % 2 === 1 ? nibbles.concat(0) : nibbles
      const bytes = new Uint8Array(normalized.length / 2)
      for (let i = 0; i < normalized.length; i += 2) {
        bytes[i / 2] = (normalized[i] << 4) | normalized[i + 1]
      }
      return new Index(bytes, nibbles.length)
    } else if (isU8a(nibbles)) {
      if (typeof length !== 'number') {
        throw new Error(`ambiguous length`)
      }
      return new Index(nibbles, length)
    } else {
      throw new Error(`unknown value for nibbles ${nibbles}`)
    }
  }
}
