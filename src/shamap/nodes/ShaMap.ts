import { ShaMapInner, StackToPath } from './ShaMapInner'
import { Path } from '../../indexes/Path'
import {
  BytesSink,
  FullIndex,
  HashT256,
  JsonObject,
  PathIndex
} from '../../types'
import { Hash256 } from '../../indexes/Hash256'
import { BinaryTrieParser } from '../binary-trie/BinaryTrieParser'
import { BRANCH } from '../binary-trie/consts'

export class ShaMap extends ShaMapInner {
  pathToLeaf(leafIndex: FullIndex): StackToPath
  pathToLeaf(path: PathIndex, leafHash: HashT256): StackToPath
  pathToLeaf(indexOrPath: PathIndex, leafHash?: HashT256): StackToPath {
    return this._findPathToLeaf(indexOrPath, leafHash)
  }

  static fromTrieJSON(trie: JsonObject): ShaMap {
    const map = new ShaMap()

    function addTo(json: JsonObject, prefix: string[] = []) {
      Object.entries(json).map(([key, val]) => {
        if (val && typeof val === 'object') {
          addTo(val as JsonObject, prefix.concat(key))
        } else if (typeof val === 'string') {
          const index = Path.from(prefix.concat(key))
          map.addItem(index, { preHashed: Hash256.from(val) })
        }
      })
    }

    addTo(trie)
    return map
  }

  static fromTrieBinary(trie: Uint8Array): ShaMap {
    const map = new ShaMap()
    const parser = new BinaryTrieParser(trie)

    function parse(node: ShaMapInner, path: number[]) {
      for (const [i, type] of parser.trieHeader()) {
        if (type === BRANCH.inner) {
          const newInner = new ShaMapInner(node.depth + 1)
          node.setBranch(i, newInner)
          parse(newInner, path.concat(i))
        } else if (type === BRANCH.preHashed) {
          const index = Path.from(path.concat(i))
          map.addItem(index, { preHashed: parser.hash() })
        } else if (type === BRANCH.item) {
          throw new Error('R.F.U')
        }
      }
    }

    parse(map, [])
    return map
  }
}
