export function isString(val: unknown): val is string {
  return typeof val === 'string'
}
export function isU8a(val: unknown): val is Uint8Array {
  return val instanceof Uint8Array
}
