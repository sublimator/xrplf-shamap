import { beforeAll, describe, expect, it } from '@jest/globals'

import ledger40000 from './ledger-full-40000.json'
import ledger38129 from './ledger-full-38129.json'
import { FullIndex, Hashable } from '../src/types'
import { ShaMap } from '../src/shamap/ShaMap'
import { hashItem } from '../src/shamap/ShaMapItem'
import { accountItem, txItem } from './itemizers'
import { buildAbbreviatedMap } from '../src/shamap/buildAbbreviated'

function testTrie(items: [FullIndex, Hashable][], expectedHash: string) {
  const map = new ShaMap()
  for (const [index, item] of items) {
    map.addItem(index, item)
  }
  const trie = map.trieJSON()
  const fromTrie = ShaMap.fromTrieJSON(trie)
  expect(fromTrie.hash().toHex()).toBe(expectedHash)
  expect(map.hash().toHex()).toBe(expectedHash)
  return trie
}

describe('Known SHAMap hashes', () => {
  describe('should be able to recalculate an account state tree', () => {
    let items: [FullIndex, Hashable][]

    const expectedHash: string = ledger38129.account_hash

    beforeAll(() => {
      items = ledger38129.accountState.map(accountItem)
    })

    it('should be able to recalculate from item contents', () => {
      const map = new ShaMap()
      for (const [index, item] of items) {
        map.addItem(index, item)
      }
      expect(map.hash().toHex()).toBe(expectedHash)
    })

    it('should be able to build/rebuild tree from hashTrieJSON', () => {
      testTrie(items, expectedHash)
    })
  })

  describe.each([ledger38129, ledger40000])(
    'should be able to build an abbreviated tree for any item',
    ledger => {
      const NUM_TESTS = Infinity

      let full: ShaMap
      let items: [FullIndex, Hashable][] = ledger.accountState.map(accountItem)
      const expectedHash: string = ledger.account_hash

      beforeAll(() => {
        full = new ShaMap()
        for (const [index, item] of items) {
          full.addItem(index, item)
        }
      })
      it.each(items.slice(0, NUM_TESTS))(
        `abbreviated tree ledger ${ledger.ledger_index} index-%s`,
        (index, item) => {
          const hash = hashItem(index, item)
          const path = full.pathToLeaf(index)
          const abbr = buildAbbreviatedMap(path)
          const trie = abbr.trieJSON()
          const fromTrie = ShaMap.fromTrieJSON(trie)
          expect(fromTrie.hash().toHex()).toBe(expectedHash)
          expect(abbr.hash().toHex()).toBe(expectedHash)
          expect(fromTrie.pathToLeaf(index).leaf).toBeUndefined()
          expect(fromTrie.pathToLeaf(index, hash).leaf!.index)
        }
      )
    }
  )

  describe('should be able to recalculate a transaction tree', () => {
    let items: [FullIndex, Hashable][]

    const expectedHash = ledger38129.transaction_hash

    beforeAll(() => {
      items = ledger38129.transactions.map(txItem)
    })

    it('should be able to recalculate from item contents', () => {
      const map = new ShaMap()
      for (const [index, item] of items) {
        map.addItem(index, item)
      }
      expect(map.hash().toHex()).toBe(expectedHash)
    })

    it('should be able to recalculate from item hashes', () => {
      const short = new ShaMap()
      for (const [index, item] of items) {
        const hash = hashItem(index, item)
        short.addItem(index, { preHashed: hash })
      }
      expect(short.hash().toHex()).toBe(expectedHash)
    })

    it('should be able to build/rebuild tree from hashTrieJSON', () => {
      const trie = testTrie(items, expectedHash)
      expect(trie).toMatchInlineSnapshot(`
        {
          "3": "D42EE1686B347D14144A2398049A29E69BC3CF76140965EB1DAFC6BC351CA683",
        }
      `)
    })
  })
})
