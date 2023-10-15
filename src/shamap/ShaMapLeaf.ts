import { ShaMapNode } from './ShaMapNode'
import { HashT256, PathIndex } from '../types'
import { ShaMapItem } from './ShaMapItem'
import { Sha512 } from '../hashes/Sha512'
import { Hash256 } from '../hashes/Hash256'

export class ShaMapLeaf extends ShaMapNode {
  private readonly itemHash: () => HashT256

  constructor(
    public index: PathIndex,
    item: ShaMapItem
  ) {
    super()
    if ('preHashed' in item) {
      this.itemHash = () => item.preHashed
    } else if ('hashPrefix' in item && 'toBytesSink' in item) {
      this.itemHash = () => {
        Hash256.assertInstance(index)
        const hash = Sha512.put(item.hashPrefix())
        item.toBytesSink(hash)
        index.toBytesSink(hash)
        return hash.finish()
      }
    } else {
      throw new Error('invalid_item: must be either Hashable or PreHashed')
    }
  }

  hash(): HashT256 {
    return this.itemHash()
  }

  isLeaf(): boolean {
    return true
  }

  isInner(): boolean {
    return false
  }
}
