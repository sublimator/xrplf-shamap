import { hexToBytes } from '@noble/hashes/utils'

export function ensureBytes(val: string | Uint8Array) {
  if (val instanceof Uint8Array) {
    return val
  } else {
    return hexToBytes(val)
  }
}
