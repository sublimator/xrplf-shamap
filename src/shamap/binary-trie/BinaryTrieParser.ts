import { Hash256 } from '../../hashes/Hash256'
import { BranchType } from './consts'

export class BinaryTrieParser {
  offset = 0

  constructor(private buf: Uint8Array) {}

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

  private readN(n: number) {
    const end = this.offset + n
    const slice = this.buf.slice(this.offset, end)
    this.offset = end
    return slice
  }

  end() {
    return this.offset >= this.buf.length
  }
}
