import { INCLUDE_PRE_HASHED_TYPE } from './consts'
import { uInt32Bytes } from '../../utils/UInt32Bytes'

export function trieVersionHeader(typed: boolean) {
  // v2, with include type byte set
  let header = 0b10 // version 2
  if (typed) {
    header |= INCLUDE_PRE_HASHED_TYPE
  }
  return uInt32Bytes(header)
}
