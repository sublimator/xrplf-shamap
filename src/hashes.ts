import { HashPrefix } from './hashes/HashPrefix'
import { Sha512 } from './hashes/Sha512'

export function transactionID(serialized: Uint8Array) {
  return Sha512.half(HashPrefix.transactionID, serialized)
}
