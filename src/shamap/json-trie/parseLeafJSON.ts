import { Hash256 } from '../../indexes/Hash256'
import { PreHashed } from '../../types'

export function parseLeafJSON(hash: string): PreHashed {
  const isTyped = hash.length === 65
  const actualHash = isTyped ? hash.slice(1) : hash
  const typeChar = isTyped ? hash[0] : 'u'
  if (typeChar !== 'l' && typeChar !== 'i' && typeChar !== 'u') {
    throw new Error(`invalid preHashed type char ${typeChar}`)
  }
  const type =
    typeChar === 'l' ? 'leaf' : typeChar === 'i' ? 'inner' : undefined
  return {
    preHashed: Hash256.from(actualHash),
    type
  }
}
