import { ShaMapInner } from './ShaMapInner'
import { ShaMapLeaf } from './ShaMapLeaf'

export interface StackToPath {
  leaf?: ShaMapLeaf
  inners: ShaMapInner[]
}
