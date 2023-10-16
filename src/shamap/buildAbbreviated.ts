import { StackToPath } from './StackToPath'
import { ShaMapInner } from './ShaMapInner'
import { ShaMapLeaf } from './ShaMapLeaf'
import { Path } from '../hashes/Path'
import { ShaMap } from './ShaMap'

export function buildAbbreviatedMap(fromOtherTree: StackToPath): ShaMap {
  const map = new ShaMap()
  const leaf = fromOtherTree.leaf
  if (!leaf) {
    throw new Error('Leaf must be provided')
  }
  const innersLength = fromOtherTree.inners.length
  if (!innersLength) {
    throw new Error('Inners must be provided')
  }
  const depth = innersLength - 1

  map['_addItem'](leaf.index, { preHashed: leaf.hash() }, depth)
  let currentInner: ShaMapInner = map
  let path: number[] = []

  fromOtherTree.inners.forEach(otherInner => {
    const nibble = leaf.index.nibblet(currentInner.depth)

    otherInner.eachBranch((sibling, i) => {
      if (i !== nibble && sibling) {
        currentInner.setBranch(
          i,
          new ShaMapLeaf(Path.from(path.concat(i)), {
            preHashed: sibling.hash()
          })
        )
      }
    })
    path.push(nibble)
    currentInner = currentInner.getBranch<ShaMapInner>(nibble)
  })
  return map
}
