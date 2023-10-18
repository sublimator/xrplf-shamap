import { concatBytes } from './concatBytes'

export function bytesList() {
  const buffers: Uint8Array[] = []
  return {
    put(val: Uint8Array) {
      buffers.push(val)
    },
    done() {
      return concatBytes(buffers)
    }
  }
}
