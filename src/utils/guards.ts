import {
  BytesSinkable,
  Hashable,
  HashT256,
  PathIndex,
  PreHashed
} from '../types'
import { ShaMapItem } from '../shamap/ShaMapItem'
import * as assert from 'assert'

export const TO_BYTES_SINK = 'toBytesSink'
export const PRE_HASHED = 'preHashed'
export const HASH_PREFIX = 'hashPrefix'

export function isString(val: unknown): val is string {
  return typeof val === 'string'
}

export function isU8a(val: unknown): val is Uint8Array {
  return val instanceof Uint8Array
}

export function isBytesSinkable(val: object): val is BytesSinkable {
  return TO_BYTES_SINK in val && typeof val[TO_BYTES_SINK] === 'function'
}

export function isIHash256(val: PathIndex | HashT256): val is HashT256 {
  return isBytesSinkable(val) && val.nibbles == 64
}

export function assertsIsIHash256(
  val: PathIndex | HashT256
): asserts val is HashT256 {
  if (!isIHash256(val)) {
    throw new Error(`Expecting hash256, not index`)
  }
}

export function isPreHashed(item: ShaMapItem): item is PreHashed {
  return PRE_HASHED in item
}

export function isHashable(item: ShaMapItem): item is Hashable {
  return TO_BYTES_SINK in item && HASH_PREFIX in item
}

export function assertLength<N extends number>(
  val: { length: number },
  length: N,
  name: string
): asserts val is { length: N } {
  if (val.length !== length) {
    throw new Error(`expected length=${length} for ${name}`)
  }
}
