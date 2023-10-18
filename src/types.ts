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
  put(data: Uint8Array): void
}

export interface BytesSinkable {
  toSink: (sink: BytesSink) => void
}

export interface Hashable extends BytesSinkable {
  hashPrefix: () => Uint8Array
}

export interface PreHashed {
  type?: 'leaf' | 'inner' // HashPrefix ??
  preHashed: HashT256
}

export interface Hexed {
  toHex(): HexString
}

export interface PathIndex extends Hexed {
  nibbles: number

  nibble(n: number): number

  eq(leafIndex: PathIndex): boolean
}

export interface HashT256 extends BytesSinkable, Hexed, PathIndex {
  nibbles: 64

  eq(leafIndex: HashT256): boolean
}

export type FullIndex = HashT256

export type HexString = string
