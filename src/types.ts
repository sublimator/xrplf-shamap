

export interface BytesSink {
  put(data: Uint8Array): this
}

export interface BytesSinkable {
  toBytesSink: (sink: BytesSink) => void
}

export interface IIndex {
  nibble(n: number): number
}

export interface IHash256 extends BytesSinkable, IIndex {
  buffer: Uint8Array
}

export type HexString = string

