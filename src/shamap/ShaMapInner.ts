import { ShaMapNode } from './ShaMapNode'
import { HashPrefix } from '../hashes/HashPrefix'
import { BytesSink, HashT256, JsonObject, PathIndex } from '../types'
import { ShaMapLeaf } from './ShaMapLeaf'
import { ShaMapItem } from './ShaMapItem'
import { Sha512 } from '../hashes/Sha512'
import { StackToPath } from './StackToPath'
import { Hash256 } from '../hashes/Hash256'

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

  hash(): HashT256 {
    return (this._hash ??= this.calculateHash())
  }

  protected calculateHash() {
    if (this.empty()) {
      return Hash256.ZERO_256
    }
    const hash = Sha512.put(HashPrefix.innerNode)
    this.toBytesSink(hash)
    return hash.finish()
  }

  toBytesSink(list: BytesSink): void {
    for (let i = 0; i < this.branches.length; i++) {
      const branch = this.branches[i]
      const hash = branch ? branch.hash() : Hash256.ZERO_256
      hash.toBytesSink(list)
    }
  }

  addItem(index: PathIndex, item: ShaMapItem): void {
    return this._addItem(index, item)
  }

  protected _addItem(index: PathIndex, item: ShaMapItem, depth = 0): void {
    const nibble = index.nibblet(this.depth)
    const existing = this.branches[nibble]
    if (existing === undefined) {
      if (this.depth < depth) {
        // Private operation, can leave tree in bad state
        const shaMapInner = new ShaMapInner(this.depth + 1)
        this.setBranch(nibble, shaMapInner)
        shaMapInner._addItem(index, item, depth)
      } else {
        this.setBranch(nibble, new ShaMapLeaf(index, item))
      }
    } else if (existing.isLeaf()) {
      const deeper = this.depth + 1
      const newInner = new ShaMapInner(deeper)
      // Set this first in empty inner so addItem can recursively
      // add many inners until indexes diverge.
      newInner.setBranch(existing.index.nibblet(deeper), existing)
      newInner._addItem(index, item, depth)
      this.setBranch(nibble, newInner)
    } else if (existing.isInner()) {
      existing._addItem(index, item, depth)
    } else {
      throw new Error('invalid ShaMap.addItem call')
    }
  }

  walkLeaves(onLeaf: (leaf: ShaMapLeaf) => void) {
    this.branches.forEach(b => {
      if (b) {
        if (b.isLeaf()) {
          onLeaf(b)
        } else if (b.isInner()) {
          b.walkLeaves(onLeaf)
        }
      }
    })
  }

  protected _findPathToLeaf(
    leafIndex: PathIndex,
    leafHash?: HashT256,
    stack: ShaMapInner[] = []
  ): StackToPath {
    const nibble = leafIndex.nibblet(this.depth)
    const target = this.branches[nibble]

    if (!target) {
      return { inners: stack }
    }

    if (target.isLeaf()) {
      if (
        (leafHash && target.hash().eq(leafHash)) ||
        target.index.eq(leafIndex)
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

  trieJSON(): JsonObject {
    const trie: JsonObject = {}
    this.eachBranch((node, ix) => {
      const nibble = ix.toString(16).toUpperCase()
      if (node) {
        trie[nibble] = node.isInner() ? node.trieJSON() : node.hash().toHex()
      }
    })
    return trie
  }
}
