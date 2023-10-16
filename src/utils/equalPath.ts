import { PathIndex } from '../types'

export function equalPath(a: PathIndex, b: PathIndex) {
  if (a.nibbles != b.nibbles) {
    return false
  }

  for (let i = 0; i < a.nibbles; i++) {
    if (a.nibble(i) !== b.nibble(i)) {
      return false
    }
  }
  return true
}
