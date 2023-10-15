import { HashT256 } from '../types'
import { type ShaMapLeaf } from './ShaMapLeaf'
import { type ShaMapInner } from './ShaMapInner'

export abstract class ShaMapNode {
  abstract isLeaf(): this is ShaMapLeaf

  abstract isInner(): this is ShaMapInner

  abstract hash(): HashT256
}
