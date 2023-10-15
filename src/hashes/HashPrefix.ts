function bytes(uint32: number): Uint8Array {
  const result = new Uint8Array(4)
  const view = new DataView(result.buffer)
  view.setUint32(0, uint32)
  return result
}

const HashPrefix: Record<string, Uint8Array> = {
  transactionID: bytes(0x54584e00),
  // transaction plus metadata
  transaction: bytes(0x534e4400),
  // account state
  accountStateEntry: bytes(0x4d4c4e00),
  // inner node in tree
  innerNode: bytes(0x4d494e00),
  // ledger master data for signing
  ledgerHeader: bytes(0x4c575200)
}

export { HashPrefix }
