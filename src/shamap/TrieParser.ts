import { Hash256 } from '../hashes/Hash256'

export class TrieParser {
  offset = 0

  constructor(private buf: Uint8Array) {}

  header() {
    const buf = this.readN(4)
    return new DataView(buf.buffer, buf.byteOffset, 4).getUint32(0)
  }

  *parsedHeader(): Generator<[i: number, empty: boolean, inner: boolean]> {
    const header = this.header()
    for (let i = 0; i < 16; i++) {
      const empty = (header & (1 << i)) === 0
      const inner = (header & (1 << (i + 16))) !== 0
      yield [i, empty, inner]
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
