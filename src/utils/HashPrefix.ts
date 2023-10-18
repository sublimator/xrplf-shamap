import { hexToBytes } from '@noble/hashes/utils'

const HashPrefix = {
  transactionID: hexToBytes('54584e00'),
  // transaction plus metadata
  transaction: hexToBytes('534e4400'),
  // account state
  accountStateEntry: hexToBytes('4d4c4e00'),
  // inner node in tree
  innerNode: hexToBytes('4d494e00'),
  manifest: hexToBytes('4d414e00'),
  validation: hexToBytes('56414c00')
} as const

export { HashPrefix }
