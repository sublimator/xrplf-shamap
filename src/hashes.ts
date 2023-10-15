import { HashPrefix } from './hashes/HashPrefix'
import { IHash256 } from './types'
import { Hash256 } from './hashes/Hash256'
import { Sha512 } from './hashes/Sha512'

export function transactionID(serialized: Uint8Array): IHash256 {
  return Hash256.fromBytes(Sha512.half(HashPrefix.transactionID, serialized))
}

