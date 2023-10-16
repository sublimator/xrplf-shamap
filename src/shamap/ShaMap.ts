import { ShaMapInner } from './ShaMapInner'
import { StackToPath } from './StackToPath'
import { Path } from '../hashes/Path'
import { FullIndex, HashT256, JsonObject, PathIndex } from '../types'
import { Hash256 } from '../hashes/Hash256'

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
}
