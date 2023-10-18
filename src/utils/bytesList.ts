import { concatBytes } from './concatBytes'
import { BytesSink } from '../types'

export function bytesList() {
  const buffers: Uint8Array[] = []
  const ret = {
    put(val: Uint8Array) {
      buffers.push(val)
    },
    done() {
      return concatBytes(buffers)
    }
  }
  return ret satisfies BytesSink
}
