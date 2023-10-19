import { ShaMapLeaf } from '../nodes/ShaMapLeaf'

export function encodeLeafJSON(node: ShaMapLeaf, typed?: boolean) {
  return typed
    ? // i|l|u character at start of hash, followed by 64 hex chars
      `${(node.hasHashable() ? 'l' : node.preHashedType() ?? 'u')[0]}${node
        .hash()
        .toHex()}`
    : node.hash().toHex()
}
