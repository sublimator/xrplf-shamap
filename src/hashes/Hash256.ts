// noinspection SuspiciousTypeOfGuard

import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import { BytesSink, HashT256, HexString, PathIndex } from '../types'
import { assertLength, isHashT256, isString, isU8a } from '../utils/guards'
import { equalPath } from '../utils/equalPath'

export class Hash256 implements HashT256 {
  static ZERO_256 = Hash256.from(Uint8Array.from({ length: 32 }))
  nibbles = 64 as const

  constructor(public readonly buffer: Readonly<Uint8Array>) {
    assertLength(buffer, 32, 'Hash256')
  }

  eq(leafIndex: PathIndex): boolean {
    return equalPath(this, leafIndex)
  }

  toBytesSink(sink: BytesSink) {
    sink.put(this.buffer)
  }

  toHex(): string {
    return bytesToHex(this.buffer).toUpperCase()
  }

  nibblet(n: number): number {
    if (n + 1 > this.nibbles) {
      throw new Error(`indexing out of bounds, ${this.nibbles}[${n}]`)
    }

    const byteIx = Math.floor(n / 2)
    const nibbleIx = n % 2
    const byte = this.buffer[byteIx]
    return nibbleIx === 1 ? byte & 0x0f : (byte & 0xf0) >> 4
  }

  static isHashT256(val: PathIndex | HashT256): val is HashT256 {
    return val instanceof Hash256 || isHashT256(val)
  }

  static assertIsHashT256(
    val: PathIndex | HashT256,
    msg = 'error'
  ): asserts val is HashT256 {
    if (!this.isHashT256(val)) {
      throw new Error(`Must be Hash256: ${msg}`)
    }
  }

  static from(val: HexString | Uint8Array): HashT256 {
    if (isString(val)) {
      return new Hash256(hexToBytes(val))
    } else if (isU8a(val)) {
      return new Hash256(val)
    } else if (Hash256.isHashT256(val)) {
      return val
    }
    throw new Error(`Invalid value ${val} for Hash256`)
  }

  toString() {
    return bytesToHex(this.buffer)
  }
}
