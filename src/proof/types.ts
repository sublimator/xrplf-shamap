export interface Transaction {
  meta: string | Uint8Array
  tx_blob: string | Uint8Array
}

export type TrieJson = { [key: string]: string | TrieJson }
export type Trie = Uint8Array | TrieJson
export type TxId = string

export interface TxProofs {
  treeHash: string // per xrpl ledger transaction_hash
  allTx: Trie
  perTx: Record<TxId, { trie: Trie }>
}
