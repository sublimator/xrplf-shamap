import { BRANCH, BranchType } from './consts'
import { uInt32Bytes } from '../../utils/UInt32Bytes'
import { ShaMapInner } from '../nodes/ShaMapInner'

export function trieBranchesHeader(inner: ShaMapInner, abbrev = true) {
  let nodeHeader = 0
  inner.eachBranch((n, i) => {
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
  return uInt32Bytes(nodeHeader)
}
