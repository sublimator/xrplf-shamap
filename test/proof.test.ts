import { describe, expect, it } from '@jest/globals'
import {
  checkTxProofTrie,
  createTxProofs,
  CreateTxProofsParams
} from '../src/proof/TxProofs'

import ledger1 from './ledger-testnet-binary-42089779.json'
import ledger2 from './ledger-binary-83258110.json'

import { transactionID } from '../src/utils/hashes'
import { hexToBytes } from '@noble/hashes/utils'
import { Transaction } from '../src/proof/types'
import { ledgerIdent } from './utils/ledgerIdent'

const ledgers = [ledger1, ledger2]

describe.each(ledgers)('proof', ledger => {
  const params: Array<Partial<CreateTxProofsParams>> = [
    { binary: false, typedTries: false },
    { binary: false, typedTries: true },
    { binary: true, typedTries: false },
    { binary: true, typedTries: true }
  ]
  describe.each(params)('binary %s', params => {
    const proofs = createTxProofs({
      transactions: ledger.transactions,
      ...params
    })

    const tries = proofs.perTx
    const txs: [string, Transaction][] = ledger.transactions.map(tx => {
      const id = transactionID(hexToBytes(tx.tx_blob)).toHex()
      return [id, tx]
    })

    expect(
      !params ? undefined : Object.values(tries).map(t => t.trie.length)
    ).toMatchSnapshot('perTx binary trie size')
    expect(!params ? undefined : proofs.allTx.length).toMatchSnapshot(
      `all Tx binary trie size`
    )

    expect(proofs).toMatchSnapshot()

    it.each(txs)(
      `should create a proof for ${ledgerIdent(ledger)}/%s`,
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
