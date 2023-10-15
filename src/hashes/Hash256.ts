// noinspection SuspiciousTypeOfGuard

import { hexToBytes } from '@noble/hashes/utils'
import { BytesSink, HexString, HashT256, PathIndex } from '../types'
import { assertLength, isIHash256, isString, isU8a } from '../utils/guards'
import { Index } from './Index'

export class Hash256 extends Index implements HashT256 {
  static ZERO_256 = Hash256.fromBytes(new Uint8Array(32))
  nibbles!: 64

  constructor(public readonly buffer: Readonly<Uint8Array>) {
    assertLength(buffer, 32, 'Hash256')
    const n: 32 = buffer.length
    super(buffer, n * 2)
  }

  toBytesSink(sink: BytesSink) {
    sink.put(this.buffer)
  }

  static isHash256(val: PathIndex | HashT256): val is HashT256 {
    return val instanceof Hash256 || isIHash256(val)
  }

  static assertInstance(
    val: PathIndex | HashT256,
    msg = 'error'
  ): asserts val is HashT256 {
    if (!this.isHash256(val)) {
      throw new Error(`Must be Hash256: ${msg}`)
    }
  }

  static fromBytes(val: HexString | Uint8Array): HashT256 {
    if (isString(val)) {
      return new Hash256(hexToBytes(val))
    } else if (isU8a(val)) {
      return new Hash256(val)
    } else if (Hash256.isHash256(val)) {
      return val
    }
    throw new Error(`Invalid value ${val} for Hash256`)
  }
}
