import { Hashable, HashT256 } from '../types'
import { ShaMap } from '../shamap/ShaMap'
import { HashPrefix } from '../hashes/HashPrefix'
import { transactionID } from '../hashes'
import { toSinkVL } from '../utils/variableLength'
import { buildAbbreviatedMap } from '../shamap/abbrev/buildAbbreviated'
import { hashItem } from '../shamap/ShaMapItem'
import { ensureBytes } from '../utils/ensureBytes'

export interface Transaction {
  meta: string | Uint8Array
  tx_blob: string | Uint8Array
}

export type TrieJson = { [key: string]: string | TrieJson }
export type Trie = Uint8Array | TrieJson
export type TxId = string

interface TxProofs {
  treeHash: string // per xrpl ledger transaction_hash
  allTx: Trie
  perTx: Record<TxId, { trie: Trie }>
}

export function transactionItemizer(tx: Transaction) {
  const tx_blob = ensureBytes(tx.tx_blob)
  const meta = ensureBytes(tx.meta)
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
  const treeHash = map.hash().toHex()
  const allTx = binary ? map.trieBinary() : map.trieJSON()
  const perTx: TxProofs['perTx'] = {}

  items.forEach(([index]) => {
    const path = map.pathToLeaf(index)
    if (!path.leaf) {
      throw new Error()
    }
    const abbrev = buildAbbreviatedMap(path)
    const trie = binary ? abbrev.trieBinary() : abbrev.trieJSON()
    const txId = index.toHex()
    perTx[txId] = {
      trie
    }
  })
  return {
    treeHash: treeHash,
    perTx: perTx,
    allTx: allTx
  }
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
