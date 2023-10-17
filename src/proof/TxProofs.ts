import { Hashable, HashT256 } from '../types'
import { ShaMap } from '../shamap/nodes/ShaMap'
import { HashPrefix } from '../utils/HashPrefix'
import { transactionID } from '../utils/hashes'
import { toSinkVL } from '../utils/variableLength'
import { buildAbbreviatedMap } from '../shamap/abbrev/buildAbbreviated'
import { hashItem } from '../shamap/nodes/ShaMapItem'
import { ensureBytes } from '../utils/ensureBytes'
import { Transaction, Trie, TxProofs } from './types'

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

export interface CreateTxProofsParams {
  transactions: Transaction[]
  binary?: boolean
}

export function createTxProofs({
  transactions,
  binary = false
}: CreateTxProofsParams): TxProofs {
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
  const abbrev =
    trie instanceof Uint8Array
      ? ShaMap.fromTrieBinary(trie)
      : ShaMap.fromTrieJSON(trie)
  return abbrev.hasHashed(index, hash) && abbrev.hash().toHex() === treeHash
}
