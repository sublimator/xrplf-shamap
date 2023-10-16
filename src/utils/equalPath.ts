import { PathIndex } from '../types'

export function equalPath(a: PathIndex, b: PathIndex) {
  if (a.nibbles != b.nibbles) {
    return false
  }

  for (let i = 0; i < a.nibbles; i++) {
    if (a.nibblet(i) !== b.nibblet(i)) {
      return false
    }
  }
  return true
}
