import { describe, expect, it } from '@jest/globals'
import {
  Transaction,
  checkTxProofTrie,
  createTxProofs
} from '../src/proof/proof'

import ledger1 from './ledger-testnet-binary-42089779.json'
import ledger2 from './ledger-binary-83258110.json'

import { transactionID } from '../src/hashes'
import { hexToBytes } from '@noble/hashes/utils'

const ledgers = [ledger1, ledger2]
describe.each(ledgers)('proof', ledger => {
  describe.each([true, false])('binary %s', binary => {
    const proofs = createTxProofs({
      transactions: ledger.transactions,
      calculateSavings: true,
      binary
    })

    const tries = proofs.tries
    const txs: [string, Transaction][] = ledger.transactions.map(tx => {
      const id = transactionID(hexToBytes(tx.tx_blob)).toHex()
      return [id, tx]
    })

    expect(proofs).toMatchSnapshot()

    it.each(txs)(
      `should create a proof for ${ledger.header.ledger_index} %s`,
      (id, tx) => {
        const proof = tries[id]
        const trie = proof.trie
        expect(checkTxProofTrie(tx, trie, ledger.header.transaction_hash)).toBe(
          true
        )
      }
    )
  })
})
