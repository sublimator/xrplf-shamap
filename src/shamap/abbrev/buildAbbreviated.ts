import { ShaMapInner, StackToPath } from '../nodes/ShaMapInner'
import { ShaMapLeaf } from '../nodes/ShaMapLeaf'
import { Path } from '../../indexes/Path'
import { ShaMap } from '../nodes/ShaMap'

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

  map.addItem(leaf.index, { preHashed: leaf.hash() }, depth)
  let currentInner: ShaMapInner = map
  let path: number[] = []

  fromOtherTree.inners.forEach(otherInner => {
    const nibble = leaf.index.nibble(currentInner.depth)

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
