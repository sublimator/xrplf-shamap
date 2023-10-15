// noinspection SuspiciousTypeOfGuard

import { hexToBytes } from '@noble/hashes/utils'
import { BytesSink, HexString, IHash256 } from '../types'
import { isString, isU8a } from '../utils/guards'
import { Index } from './Index'

export class Hash256 extends Index implements IHash256 {
  static ZERO_256 = Hash256.fromBytes(new Uint8Array(32))

  constructor(public readonly buffer: Readonly<Uint8Array>) {
    super(buffer, buffer.length * 2)
  }

  toBytesSink(sink: BytesSink) {
    sink.put(this.buffer)
  }

  static isHash256(val: unknown): val is Hash256 {
    return val instanceof Hash256
  }

  static assertInstance(val: unknown): asserts val is Hash256 {
    if (!this.isHash256(val)) {
      throw new Error(`Must be Hash256`)
    }
  }

  static fromBytes(val: HexString | Uint8Array) {
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
