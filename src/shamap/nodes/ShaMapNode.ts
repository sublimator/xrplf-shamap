import { HashT256 } from '../../types'
import { type ShaMapLeaf } from './ShaMapLeaf'
import { type ShaMapInner } from './ShaMapInner'

export abstract class ShaMapNode {
  protected _hash?: HashT256

  hash(): HashT256 {
    return (this._hash ??= this.calculateHash())
  }

  protected abstract calculateHash(): HashT256

  abstract isLeaf(): this is ShaMapLeaf

  abstract isInner(): this is ShaMapInner
}
