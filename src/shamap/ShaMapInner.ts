import { ShaMapNode } from './ShaMapNode'
import { HashPrefix } from '../hashes/HashPrefix'
import { BytesSink, HashT256, PathIndex } from '../types'
import { ShaMapLeaf } from './ShaMapLeaf'
import { ShaMapItem } from './ShaMapItem'
import { Sha512 } from '../hashes/Sha512'
import { StackToPath } from './StackToPath'
import { Hash256 } from '../hashes/Hash256'
import { TrieJson } from '../proof/proof'
import { BRANCH, BranchType } from './binary-trie/consts'
import { uint32Bytes } from '../utils/Uint32Bytes'
import { concatBytes } from '../utils/concatBytes'

export class ShaMapInner extends ShaMapNode {
  private slotBits = 0
  private readonly branches: Array<ShaMapNode | undefined> = Array.from({
    length: 16
  })

  constructor(public readonly depth: number = 0) {
    super()
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

  getBranch<T extends ShaMapNode>(slot: number) {
    return this.branches[slot] as T
  }

  eachBranch(each: (node: ShaMapNode | undefined, ix: number) => void) {
    this.branches.forEach(each)
  }

  empty(): boolean {
    return this.slotBits === 0
  }

  protected calculateHash() {
    if (this.empty()) {
      return Hash256.ZERO_256
    }
    const hash = Sha512.put(HashPrefix.innerNode)
    this.toSink(hash)
    return hash.finish()
  }

  toSink(list: BytesSink): void {
    for (let i = 0; i < this.branches.length; i++) {
      const branch = this.branches[i]
      const hash = branch ? branch.hash() : Hash256.ZERO_256
      hash.toSink(list)
    }
  }

  hasHashed(index: PathIndex, hash: HashT256) {
    const leaf = this._findPathToLeaf(index, hash).leaf
    // We've already checked, but can't hurt too much to check twice!
    return Boolean(leaf?.hash().eq(hash))
  }

  addItem(index: PathIndex, item: ShaMapItem, depth = 0): void {
    if (depth !== 0 && !('preHashed' in item)) {
      throw new Error('probably a mistake')
    }

    const nibble = index.nibble(this.depth)
    const existing = this.branches[nibble]
    if (existing === undefined) {
      if (this.depth < depth) {
        // Private operation, can leave tree in bad state
        const shaMapInner = new ShaMapInner(this.depth + 1)
        this.setBranch(nibble, shaMapInner)
        shaMapInner.addItem(index, item, depth)
      } else {
        this.setBranch(nibble, new ShaMapLeaf(index, item))
      }
    } else if (existing.isLeaf()) {
      const deeper = this.depth + 1
      const newInner = new ShaMapInner(deeper)
      // Set this first in empty inner so addItem can recursively
      // add many inners until indexes diverge.
      newInner.setBranch(existing.index.nibble(deeper), existing)
      newInner.addItem(index, item, depth)
      this.setBranch(nibble, newInner)
    } else if (existing.isInner()) {
      existing.addItem(index, item, depth)
    } else {
      throw new Error('invalid ShaMap.addItem call')
    }
  }

  protected _findPathToLeaf(
    leafIndex: PathIndex,
    leafHash?: HashT256,
    stack: ShaMapInner[] = []
  ): StackToPath {
    const nibble = leafIndex.nibble(this.depth)
    const target = this.branches[nibble]

    if (!target) {
      return { inners: stack }
    }

    if (target.isLeaf()) {
      if (
        (leafHash && target.hash().eq(leafHash)) ||
        (!leafHash && target.index.eq(leafIndex))
      ) {
        return { leaf: target, inners: [...stack, this] }
      }
    }

    if (target.isInner()) {
      stack.push(this)
      return target._findPathToLeaf(leafIndex, leafHash, stack)
    }

    return { inners: stack }
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

  sinkTrieBinary(sink: BytesSink, abbrev: boolean = true) {
    const header = this.trieBranchesHeader(abbrev)
    sink.put(header)

    this.eachBranch((node, ix) => {
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
    const buffers: Uint8Array[] = []
    const sink: BytesSink = {
      put(buf: Uint8Array) {
        buffers.push(buf)
        return this
      }
    }
    this.sinkTrieBinary(sink, abbrev)
    return concatBytes(buffers)
  }

  trieBranchesHeader(abbrev = true) {
    let nodeHeader = 0
    this.eachBranch((n, i) => {
      let type: BranchType = BRANCH.empty

      if (n) {
        if (n.isInner()) {
          type = BRANCH.inner
        } else if (n.isLeaf()) {
          type = abbrev || n.hasPreHashed() ? BRANCH.preHashed : BRANCH.item
        }
      }
      nodeHeader |= type << (i * 2)
    })
    return uint32Bytes(nodeHeader)
  }
}
