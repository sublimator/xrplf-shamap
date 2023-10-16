import { describe, expect, it } from '@jest/globals'
import { Transaction, checkProof, createProofs } from '../src/proof/proof'

import ledger1 from './ledger-testnet-binary-42089779.json'
import ledger2 from './ledger-binary-83258110.json'

import { transactionID } from '../src/hashes'
import { hexToBytes } from '@noble/hashes/utils'

const ledgers = [ledger1, ledger2]
describe.each(ledgers)('proof', ledger => {
  const proofs = createProofs(ledger.transactions)
  const tries = proofs.tries
  const txs = ledger.transactions.map(tx => {
    const id = transactionID(hexToBytes(tx.tx_blob)).toHex()
    return [id, tx] as [string, Transaction]
  })

  expect(proofs.fullTrie).toMatchSnapshot()

  it.each(txs)(
    `should create a proof for ${ledger.header.ledger_index} %s`,
    (id, tx) => {
      const proof = tries[id]
      const trie = proof.trie
      expect(checkProof(tx, trie, ledger.header.transaction_hash)).toBe(true)
      expect(trie).toMatchSnapshot()
      expect(proof.saving).toMatchSnapshot()
    }
  )
})
