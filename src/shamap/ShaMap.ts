import { ShaMapInner } from './ShaMapInner'
import { StackToPath } from './StackToPath'
import { Path } from '../hashes/Path'
import { FullIndex, HashT256, JsonObject, PathIndex } from '../types'
import { Hash256 } from '../hashes/Hash256'
import { BinaryParser } from './BinaryParser'
import { BRANCH } from './consts'

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
    const parser = new BinaryParser(trie)

    function parse(node: ShaMapInner, path: number[]) {
      for (const [i, type] of parser.trieHeader()) {
        if (type === BRANCH.inner) {
          const newInner = new ShaMapInner(node.depth + 1)
          node.setBranch(i, newInner)
          parse(newInner, path.concat(i))
        } else if (type === BRANCH.preHashed || type === BRANCH.item) {
          const index = Path.from(path.concat(i))
          map.addItem(index, { preHashed: parser.hash() })
        }
      }
    }

    parse(map, [])
    return map
  }
}
