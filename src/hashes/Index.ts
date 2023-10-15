import { PathIndex } from '../types'
import { isString } from '../utils/guards'
import { hexToBytes } from '@noble/hashes/utils'

export function nibblesToBytes(nibbles: number[]) {
  const bytes = new Uint8Array(nibbles.length / 2)
  for (let i = 0; i < nibbles.length; i += 2) {
    bytes[i / 2] = (nibbles[i] << 4) | nibbles[i + 1]
  }
  return bytes
}

export class Index implements PathIndex {
  constructor(
    public readonly buffer: Readonly<Uint8Array>,
    public nibbles: number
  ) {}

  nibble(n: number): number {
    if (n + 1 > this.nibbles) {
      throw new Error(`indexing out of bounds, ${this.nibbles}[${n}]`)
    }

    const byteIx = Math.floor(n / 2)
    const nibbleIx = n % 2
    const byte = this.buffer[byteIx]
    return nibbleIx === 1 ? byte & 0x0f : (byte & 0xf0) >> 4
  }

  static fromNibbles(nibbles: string | number[]): Index
  static fromNibbles(nibbles: string | number[]): Index {
    if (isString(nibbles)) {
      const normalized = nibbles.length % 2 === 1 ? nibbles + '0' : nibbles
      return new Index(hexToBytes(normalized), nibbles.length)
    } else if (Array.isArray(nibbles)) {
      const bytes = nibblesToBytes(
        nibbles.length % 2 === 1 ? nibbles.concat(0) : nibbles
      )
      return new Index(bytes, nibbles.length)
    } else {
      throw new Error(`unknown value for nibbles ${nibbles}`)
    }
  }
}
