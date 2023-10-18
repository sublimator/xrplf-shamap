import { HexString, PathIndex } from '../types'
import { equalPath } from '../utils/equalPath'
import { parseNibble } from '../utils/parseNibble'

export class Path implements PathIndex {
  constructor(
    public readonly turns: number[],
    public nibbles: number
  ) {
    if (nibbles === 0) {
      throw new Error(`Need at least one nibble`)
    }
  }

  eq(other: PathIndex): boolean {
    return equalPath(this, other)
  }

  toHex(): HexString {
    return this.turns.map(n => n.toString(16).toUpperCase()).join('')
  }

  nibble(n: number): number {
    if (n + 1 > this.nibbles) {
      throw new Error(`indexing out of bounds, ${this.nibbles}[${n}]`)
    }
    return this.turns[n]
  }

  static from(nibbles: (string | number)[]): Path {
    return new Path(nibbles.map(parseNibble), nibbles.length)
  }
}
