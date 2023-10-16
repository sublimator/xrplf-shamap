import { FullIndex, Hashable } from '../src/types'
import { HashPrefix } from '../src/hashes/HashPrefix'
import { STObject } from 'ripple-binary-codec/dist/types/st-object'
import { BinarySerializer, BytesList } from 'ripple-binary-codec/dist/binary'
import { Hash256 } from '../src/hashes/Hash256'

export const accountItem = (t: { index: string }) => {
  const index = Hash256.from(t.index)
  const item: Hashable = {
    hashPrefix: () => HashPrefix.accountStateEntry,
    toBytesSink(sink) {
      sink.put(STObject.from(t).toBytes())
    }
  }
  return [index, item] as [FullIndex, Hashable]
}
export const txItem = (t: { hash: string; metaData: {} }) => {
  const index = Hash256.from(t.hash)
  const item: Hashable = {
    hashPrefix: () => HashPrefix.transaction,
    toBytesSink(sink) {
      // We shouldn't need this, but ripple-binary-codec got messed up
      const blSink = new BytesList()
      const serializer = new BinarySerializer(blSink)
      serializer.writeLengthEncoded(STObject.from(t))
      serializer.writeLengthEncoded(STObject.from(t.metaData))
      sink.put(blSink.toBytes())
    }
  }
  return [index, item] as [FullIndex, Hashable]
}
