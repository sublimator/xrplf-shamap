import { Hashable, HashT256 } from '../types'
import { ShaMap } from '../shamap/ShaMap'
import { HashPrefix } from '../hashes/HashPrefix'
import { transactionID } from '../hashes'
import { hexToBytes } from '@noble/hashes/utils'
import { toSinkVL } from '../utils/variableLength'
import { buildAbbreviatedMap } from '../shamap/buildAbbreviated'
import { hashItem } from '../shamap/ShaMapItem'

export interface Transaction {
  meta: string
  tx_blob: string
}

export type Trie = { [key: string]: string | Trie }

interface TxProofs {
  fullTrie: Trie
  saving?: number
  tries: Record<string, { trie: Trie; saving?: number }>
  // matches ledger transaction_hash
  transaction_hash: string
}

export function transactionItemizer(tx: Transaction) {
  const tx_blob = hexToBytes(tx.tx_blob)
  const meta = hexToBytes(tx.meta)
  const id = transactionID(tx_blob)
  const hashable: Hashable = {
    hashPrefix: () => HashPrefix.transaction,
    toSink(sink) {
      toSinkVL(sink, tx_blob)
      toSinkVL(sink, meta)
    }
  }
  return [id, hashable] as [HashT256, Hashable]
}

interface TxProofs1 {
  transactions: Transaction[]
  calculateSavings?: boolean
}

export function createTxProofs({
  transactions,
  calculateSavings = false
}: TxProofs1): TxProofs {
  const map = new ShaMap()
  const items = transactions.map(transactionItemizer)
  for (const [index, item] of items) {
    map.addItem(index, item)
  }
  const tx_hash = map.hash().toHex()
  const proofs: TxProofs['tries'] = {}
  const fullTrie = map.trieJSON()
  const total = JSON.stringify(fullTrie).length
  const saving = !calculateSavings
    ? undefined
    : transactions.length *
        (64 + 64 + JSON.stringify({ key: '', hash: '' }).length) -
      total

  items.forEach(([index]) => {
    const path = map.pathToLeaf(index)
    if (!path.leaf) {
      throw new Error()
    }
    const abbrev = buildAbbreviatedMap(path)
    const trie = abbrev.trieJSON()
    const tx_id = index.toHex()
    proofs[tx_id] = {
      trie,
      saving: !calculateSavings
        ? undefined
        : total - JSON.stringify(trie).length
    }
  })
  return { saving, transaction_hash: tx_hash, tries: proofs, fullTrie }
}

export function checkTxProofTrie(
  tx: Transaction,
  trie: Trie,
  treeHash: string
) {
  const [index, item] = transactionItemizer(tx)
  const hash = hashItem(index, item)
  const abbrev = ShaMap.fromTrieJSON(trie)
  return abbrev.hasHashed(index, hash) && abbrev.hash().toHex() === treeHash
}
