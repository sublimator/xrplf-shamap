export type JSONValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JSONArray
  | JsonObject

export type JSONArray = JSONValue[]
export type JsonObject = { [key: string]: JSONValue }

export interface BytesSink {
  put(data: Uint8Array): this
}

export interface BytesSinkable {
  toSink: (sink: BytesSink) => void
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

  eq(leafIndex: PathIndex): boolean
}

export interface Hexed {
  toHex(): HexString
}

export interface HashT256 extends BytesSinkable, Hexed, PathIndex {
  nibbles: 64
  eq(leafIndex: HashT256): boolean
}

export type FullIndex = HashT256

export type HexString = string
