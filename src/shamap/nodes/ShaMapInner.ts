import { ShaMapNode } from './ShaMapNode'
import { HashPrefix } from '../../utils/HashPrefix'
import { BytesSink, FullIndex, HashT256, PathIndex } from '../../types'
import { ShaMapLeaf } from './ShaMapLeaf'
import { ShaMapItem } from './ShaMapItem'
import { Sha512 } from '../../indexes/Sha512'
import { Hash256 } from '../../indexes/Hash256'
import { TrieJson } from '../../proof/types'
import { trieBranchesHeader } from '../binary-trie/trieBranchesHeader'
import { bytesList } from '../../utils/bytesList'

export class ShaMapInner extends ShaMapNode {
  private slotBits = 0
  private readonly branches: Array<ShaMapNode | undefined> = Array.from({
    length: 16
  })

  constructor(public readonly depth: number = 0) {
    super()
  }

  protected calculateHash() {
    if (this.empty()) {
      return Hash256.ZERO_256
    }
    const hash = Sha512.put(HashPrefix.innerNode)
    this.toSink(hash)
    return hash.finish()
  }

  isInner(): this is ShaMapInner {
    return true
  }

  isLeaf(): this is ShaMapLeaf {
    return false
  }

  setBranch(slot: number, branch: ShaMapNode): void {
    this.slotBits = this.slotBits | (1 << slot)
    this.branches[slot] = branch
  }

  getBranch<T extends ShaMapNode = ShaMapNode>(slot: number): T | undefined {
    return this.branches[slot] as T | undefined
  }

  eachBranch(each: (node: ShaMapNode | undefined, ix: number) => void) {
    this.branches.forEach(each)
  }

  empty(): boolean {
    return this.slotBits === 0
  }

  toSink(list: BytesSink): void {
    for (let i = 0; i < this.branches.length; i++) {
      const branch = this.branches[i]
      const hash = branch ? branch.hash() : Hash256.ZERO_256
      hash.toSink(list)
    }
  }

  getLeaf(index: FullIndex): ShaMapLeaf | undefined

  getLeaf(index: PathIndex, leafHash: HashT256): ShaMapLeaf | undefined
  getLeaf(index: PathIndex, leafHash?: HashT256): ShaMapLeaf | undefined {
    const target = this.followPath(index)
    if (target) {
      if (target.isLeaf()) {
        if (
          (leafHash && target.hash().eq(leafHash)) ||
          (!leafHash && target.index.eq(index))
        ) {
          return target
        }
      }
    }
  }

  hasPath(index: PathIndex): boolean {
    return !!this.followPath(index)
  }

  followPath(index: PathIndex): ShaMapNode | undefined {
    const b = this.selectBranch(index)
    // We may not have a full path
    if (b && b.isInner() && index.nibbles > b.depth) {
      return b.followPath(index)
    }
    return b
  }

  selectBranch(index: PathIndex) {
    return this.getBranch(index.nibble(this.depth))
  }

  hasHashed(index: PathIndex, hash: HashT256) {
    return Boolean(this.getLeaf(index, hash))
  }

  addItem(index: PathIndex, item: ShaMapItem): void {
    const nibble = index.nibble(this.depth)
    const existing = this.branches[nibble]
    if (existing === undefined) {
      this.setBranch(nibble, new ShaMapLeaf(index, item))
    } else if (existing.isLeaf()) {
      const deeper = this.depth + 1
      const newInner = new ShaMapInner(deeper)
      // Set this first in empty inner so addItem can recursively
      // add many inners until indexes diverge.
      newInner.setBranch(existing.index.nibble(deeper), existing)
      newInner.addItem(index, item)
      this.setBranch(nibble, newInner)
    } else if (existing.isInner()) {
      existing.addItem(index, item)
    } else {
      throw new Error('invalid ShaMap.addItem call')
    }
  }

  trieJSON(): TrieJson {
    const trie: TrieJson = {}
    this.eachBranch((node, ix) => {
      const nibble = ix.toString(16).toUpperCase()
      if (node) {
        trie[nibble] = node.isInner() ? node.trieJSON() : node.hash().toHex()
      }
    })
    return trie
  }

  protected sinkTrieBinary(sink: BytesSink, abbrev: boolean = true) {
    const header = trieBranchesHeader(this, abbrev)
    sink.put(header)

    this.eachBranch(node => {
      if (node) {
        if (node.isInner()) {
          node.sinkTrieBinary(sink, abbrev)
        } else if (node.isLeaf()) {
          if (abbrev || node.hasPreHashed()) {
            node.hash().toSink(sink)
          } else {
            throw new Error('R.F.U')
          }
        }
      }
    })
  }

  trieBinary(abbrev = true) {
    const list = bytesList()
    this.sinkTrieBinary(list, abbrev)
    return list.done()
  }

  walkLeaves(onLeaf: (node: ShaMapLeaf) => void) {
    this.eachBranch(b => {
      if (b) {
        if (b.isInner()) {
          b.walkLeaves(onLeaf)
        } else if (b.isLeaf() && !b.hasPreHashedInner()) {
          onLeaf(b)
        }
      }
    })
  }
}
