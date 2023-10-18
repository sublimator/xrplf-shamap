import { Hash256 } from '../../indexes/Hash256'
import { BranchType, INCLUDE_PRE_HASHED_TYPE } from './consts'
import { PreHashed } from '../../types'

export class BinaryTrieParser {
  offset = 0

  constructor(
    private buf: Uint8Array,
    private version = 0
  ) {}

  readAndSetVersion() {
    this.version = this.uint32()
    return this
  }

  reset() {
    this.offset = 0
  }

  uint32() {
    const buf = this.readN(4)
    return new DataView(buf.buffer, buf.byteOffset, 4).getUint32(0)
  }

  *trieHeader(): Generator<[number, BranchType]> {
    const header = this.uint32()
    for (let i = 0; i < 16; i++) {
      const type = header & (0b11 << (i * 2))
      yield [i, (type >>> (i * 2)) as BranchType]
    }
  }

  hash() {
    const slice = this.readN(32)
    return Hash256.from(slice)
  }

  preHashed(): PreHashed {
    const preHashedType = this.preHashedType()

    const hash = this.hash()
    return {
      preHashed: hash,
      type: preHashedType
    }
  }

  preHashedType(): PreHashed['type'] {
    if ((this.version & INCLUDE_PRE_HASHED_TYPE) === 0) {
      return undefined
    }

    const type = this.readN(1)[0]
    // TODO: put this in utils
    if (type < 0 || type > 2) {
      throw new Error()
    }
    return type === 0 ? undefined : type === 1 ? 'inner' : 'leaf'
  }

  readN(n: number) {
    const end = this.offset + n
    const slice = this.buf.slice(this.offset, end)
    this.offset = end
    if (slice.length !== n) {
      throw new Error(`not enough bytes, only: ${slice.length}/${n}`)
    }
    return slice
  }

  end() {
    return this.offset >= this.buf.length
  }
}
