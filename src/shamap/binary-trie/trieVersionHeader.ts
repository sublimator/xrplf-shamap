import { INCLUDE_PRE_HASHED_TYPE } from './consts'

export function trieVersionHeader(typed: boolean) {
  let header = 0b0
  if (typed) {
    header |= INCLUDE_PRE_HASHED_TYPE
  }
  return Uint8Array.of(header)
}

export const VERSION_HEADER_LENGTH = trieVersionHeader(false).length
