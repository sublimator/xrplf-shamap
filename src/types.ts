export interface BytesSink {
  put(data: Uint8Array): this
}

export interface BytesSinkable {
  toBytesSink: (sink: BytesSink) => void
}

export interface Hashable extends BytesSinkable {
  hashPrefix: () => Uint8Array
}

export interface PreHashed {
  preHashed: HashT256
}

export interface PathIndex {
  nibbles: number

  nibble(n: number): number

  toHex(): string
}

export interface HashT256 extends BytesSinkable, PathIndex {
  nibbles: 64
}

export type FullIndex = HashT256

export type HexString = string
