import { BytesSinkable, HashT256, PathIndex } from '../types'

export const TO_SINK = 'toSink' as const

export function isString(val: unknown): val is string {
  return typeof val === 'string'
}

export function isU8a(val: unknown): val is Uint8Array {
  return val instanceof Uint8Array
}

export function isBytesSinkable(val: object): val is BytesSinkable {
  return TO_SINK in val && typeof val[TO_SINK] === 'function'
}

export function isHashT256(val: PathIndex | HashT256): val is HashT256 {
  return isBytesSinkable(val) && val.nibbles == 64
}

export function assertLength<N extends number>(
  val: { length: number },
  length: N,
  name: string
): asserts val is { length: N } {
  if (val.length !== length) {
    throw new Error(`expected length=${length} for ${name}, got ${val.length}`)
  }
}
