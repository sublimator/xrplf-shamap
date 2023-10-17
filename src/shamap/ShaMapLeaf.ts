import { Hashable, type HashT256, type PathIndex, PreHashed } from '../types'
import { type ShaMapInner } from './ShaMapInner'
import { ShaMapNode } from './ShaMapNode'
import { createItemHashFunc, type ShaMapItem } from './ShaMapItem'

export class ShaMapLeaf extends ShaMapNode {
  protected readonly calculateHash: () => HashT256

  constructor(
    public index: PathIndex,
    public item: ShaMapItem
  ) {
    super()
    this.calculateHash = createItemHashFunc(index, item)
  }

  isLeaf(): this is ShaMapLeaf {
    return true
  }

  isInner(): this is ShaMapInner {
    return false
  }

  hasPreHashed(): boolean {
    return 'preHashed' in this.item
  }

  hasHashable(): boolean {
    return !this.hasPreHashed()
  }
}
