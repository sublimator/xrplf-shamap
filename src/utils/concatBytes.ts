export function concatBytes(arrays: Uint8Array[]): Uint8Array {
  const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0))
  let pad = 0 // walk through each item, ensure they have proper type
  arrays.forEach(a => {
    // noinspection SuspiciousTypeOfGuard
    if (!(a instanceof Uint8Array)) throw new Error('Uint8Array expected')
    r.set(a, pad)
    pad += a.length
  })
  return r
}
