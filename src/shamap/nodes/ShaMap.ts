import { ShaMapInner } from './ShaMapInner'
import { Path } from '../../indexes/Path'
import { JsonObject, PathIndex } from '../../types'
import { Hash256 } from '../../indexes/Hash256'
import { BinaryTrieParser } from '../binary-trie/BinaryTrieParser'
import { BRANCH } from '../binary-trie/consts'

export class ShaMap extends ShaMapInner {
  static fromTrieJSON(trie: JsonObject): ShaMap {
    const map = new ShaMap()

    function addTo(json: JsonObject, prefix: string[] = []) {
      Object.entries(json).map(([key, val]) => {
        if (val && typeof val === 'object') {
          addTo(val as JsonObject, prefix.concat(key))
        } else if (typeof val === 'string') {
          const index = Path.from(prefix.concat(key))
          // item type is undefined, todo?
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
          // item type is undefined, todo?
          map.addItem(index, { preHashed: parser.hash() })
        } else if (type === BRANCH.item) {
          throw new Error('R.F.U')
        }
      }
    }

    parse(map, [])
    return map
  }

  abbreviatedIncluding(subtree: ShaMap) {
    return this.abbreviate((depth, ix, path) => {
      const index = Path.from(path)
      return subtree.hasPath(index)
    })
  }

  abbreviatedWith(path: PathIndex) {
    return this.abbreviate((d, ix) => path.nibble(d) === ix)
  }

  abbreviate(
    onPath: (depth: number, ix: number, path: number[]) => boolean = () => true
  ) {
    const map = new ShaMap()

    function walk(inner: ShaMapInner, _path: number[]) {
      /// we can't just do this ...
      inner.eachBranch((node, ix) => {
        if (node) {
          const nodePath = _path.concat(ix)
          const wantPath = onPath(_path.length, ix, nodePath)
          if (node.isInner() && wantPath) {
            walk(node, nodePath)
          } else {
            // This just pulls in the other tree
            // It's job isn't to fully abbreviate, but rather build a subtree
            // We may want to do something with the full items, so just keep
            // them for now.
            if (node.isLeaf() && wantPath) {
              map.addItem(node.index, node.item)
            } else {
              map.addItem(Path.from(nodePath), {
                type: node.isInner() ? 'inner' : 'leaf',
                preHashed: node.hash()
              })
            }
          }
        }
      })
    }

    walk(this, [])
    return map
  }
}
