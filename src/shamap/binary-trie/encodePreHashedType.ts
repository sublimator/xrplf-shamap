export function encodePreHashedType(type: 'leaf' | 'inner' | undefined) {
  const map = { undefined: 0, inner: 1, leaf: 2 }
  const to = map[`${type}`]
  if (typeof to === 'undefined') {
    throw new Error(`unknown preHashed type: ${type}`)
  }
  return Uint8Array.of(to)
}
