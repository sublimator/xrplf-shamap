import { BytesSink } from '../types'

export function variableLength(length: number): Uint8Array {
  const lenBytes = new Uint8Array(3)
  if (length <= 192) {
    lenBytes[0] = length
    return lenBytes.slice(0, 1)
  } else if (length <= 12480) {
    length -= 193
    lenBytes[0] = 193 + (length >>> 8)
    lenBytes[1] = length & 0xff
    return lenBytes.slice(0, 2)
  } else if (length <= 918744) {
    length -= 12481
    lenBytes[0] = 241 + (length >>> 16)
    lenBytes[1] = (length >> 8) & 0xff
    lenBytes[2] = length & 0xff
    return lenBytes.slice(0, 3)
  }
  throw new Error('Overflow error')
}

export function toSinkVL(sink: BytesSink, tx_blob: Uint8Array) {
  sink.put(variableLength(tx_blob.length))
  sink.put(tx_blob)
}
