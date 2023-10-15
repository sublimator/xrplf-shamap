import { BytesSink, IHash256 } from '../types'

export interface Hashable {
  hashPrefix: () => Buffer
  toBytesSink: (list: BytesSink) => void
}

export interface PreHashed {
  preHashed: IHash256
}

export type ShaMapItem = Hashable | PreHashed
