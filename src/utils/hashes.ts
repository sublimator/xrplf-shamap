import { HashPrefix } from './HashPrefix'
import { Sha512 } from '../indexes/Sha512'

export function transactionID(serialized: Uint8Array) {
  return Sha512.half(HashPrefix.transactionID, serialized)
}
