import { hexToBytes } from '@noble/hashes/utils'
import { Hashable, HashT256 } from '../types'
import { ShaMap } from '../shamap/ShaMap'
import { HashPrefix } from '../hashes/HashPrefix'
import { transactionID } from '../hashes'
import { toSinkVL } from '../utils/variableLength'
import { buildAbbreviatedMap } from '../shamap/abbrev/buildAbbreviated'
import { hashItem } from '../shamap/ShaMapItem'

export interface Transaction {
  meta: string
  tx_blob: string
}

export type TrieJson = { [key: string]: string | TrieJson }
export type Trie = Uint8Array | TrieJson

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
  binary?: boolean
}

export function createTxProofs({
  transactions,
  binary = false
}: TxProofs1): TxProofs {
  const map = new ShaMap()
  const items = transactions.map(transactionItemizer)
  for (const [index, item] of items) {
    map.addItem(index, item)
  }
  const tx_hash = map.hash().toHex()
  const proofs: TxProofs['tries'] = {}
  const fullTrie = binary ? map.trieBinary() : map.trieJSON()

  items.forEach(([index]) => {
    const path = map.pathToLeaf(index)
    if (!path.leaf) {
      throw new Error()
    }
    const abbrev = buildAbbreviatedMap(path)
    const trie = binary ? abbrev.trieBinary() : abbrev.trieJSON()
    const tx_id = index.toHex()
    proofs[tx_id] = {
      trie
    }
  })
  return { transaction_hash: tx_hash, tries: proofs, fullTrie }
}

export function checkTxProofTrie(
  tx: Transaction,
  trie: Trie,
  treeHash: string
) {
  const [index, item] = transactionItemizer(tx)
  const hash = hashItem(index, item)
  let abbrev: ShaMap
  if (trie instanceof Uint8Array) {
    abbrev = ShaMap.fromTrieBinary(trie)
  } else {
    abbrev = ShaMap.fromTrieJSON(trie)
  }
  return abbrev.hasHashed(index, hash) && abbrev.hash().toHex() === treeHash
}
