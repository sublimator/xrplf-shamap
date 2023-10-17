import { Hashable, PathIndex, PreHashed } from '../../types'
import { Sha512 } from '../../indexes/Sha512'
import { Hash256 } from '../../indexes/Hash256'

export type ShaMapItem = Hashable | PreHashed

export function createItemHashFunc(index: PathIndex, item: ShaMapItem) {
  if ('preHashed' in item) {
    return () => item.preHashed
  } else if ('hashPrefix' in item && 'toSink' in item) {
    return () => {
      Hash256.assertIsHashT256(index, 'probably expecting full tree')
      const hash = Sha512.put(item.hashPrefix())
      item.toSink(hash)
      index.toSink(hash)
      return hash.finish()
    }
  } else {
    throw new Error('invalid_item: must be either Hashable or PreHashed')
  }
}

export function hashItem(index: PathIndex, item: ShaMapItem) {
  return createItemHashFunc(index, item)()
}
