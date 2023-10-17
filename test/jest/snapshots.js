module.exports = {
  test(value /*: unknown*/) {
    return value instanceof Uint8Array
  },
  print(value /*: Uint8Array*/) {
    return Buffer.from(value).toString('base64')
  }
}
