export function uint32Bytes(value: number) {
  const headerBytes = new Uint8Array(4)
  const view = new DataView(headerBytes.buffer)
  view.setUint32(0, value)
  return headerBytes
}
