import { ShaMapNode } from './ShaMapNode'
import { HashPrefix } from '../hashes/HashPrefix'
import { BytesSink, FullIndex, HashT256, PathIndex } from '../types'
import { ShaMapLeaf } from './ShaMapLeaf'
import { Hash256 } from '../hashes/Hash256'
import { ShaMapItem } from './ShaMapItem'
import { Sha512 } from '../hashes/Sha512'
import { isHashable } from '../utils/guards'

export class ShaMapInner extends ShaMapNode {
  private slotBits = 0
  private branches: Array<ShaMapNode> = Array.from({ length: 16 })

  constructor(private depth: number = 0) {
    super()
  }

  isInner(): boolean {
    return true
  }

  isLeaf(): boolean {
    return false
  }

  setBranch(slot: number, branch: ShaMapNode): void {
    this.slotBits = this.slotBits | (1 << slot)
    this.branches[slot] = branch
  }

  /**
   * @returns true if node is empty
   */
  empty(): boolean {
    return this.slotBits === 0
  }

  hash(): HashT256 {
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

  getItemAtPath(index: FullIndex): void
  getItemAtPath(index: PathIndex, expectedHash: HashT256): void
  getItemAtPath(index: PathIndex | FullIndex, expectedHash?: HashT256): void {
    const nibble = index.nibble(this.depth)
  }

  addItem(index: PathIndex, item: ShaMapItem): void {
    if (isHashable(item)) {
      Hash256.assertIsHashT256(index, 'expecting full tree')
    }

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

  walkLeaves(onLeaf: (leaf: ShaMapLeaf) => void) {
    this.branches.forEach(b => {
      if (b.isLeaf()) {
        onLeaf(b)
      } else if (b.isInner()) {
        b.walkLeaves(onLeaf)
      }
    })
  }
}
