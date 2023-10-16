import { PathIndex } from '../types'
import { isString } from '../utils/guards'
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

  nibblet(n: number): number {
    if (n + 1 > this.nibbles) {
      throw new Error(`indexing out of bounds, ${this.nibbles}[${n}]`)
    }
    return this.turns[n]
  }

  static from(nibbles: string | (string | number)[]): Path
  static from(nibbles: string | (string | number)[]): Path {
    if (isString(nibbles)) {
      return new Path(
        Array.from(nibbles).map(n => parseInt(n, 16)),
        nibbles.length
      )
    } else if (Array.isArray(nibbles)) {
      return new Path(nibbles.map(parseNibble), nibbles.length)
    } else {
      throw new Error(`unknown value for nibbles ${nibbles}`)
    }
  }
}
