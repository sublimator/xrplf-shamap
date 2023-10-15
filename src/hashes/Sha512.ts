import { BytesSink, IHash256 } from '../types'
import { sha512 } from '@noble/hashes/sha512'
import { Hash256 } from './Hash256'

export class Sha512 implements BytesSink {
  private hash = sha512.create()

  static put(bytes: Uint8Array): Sha512 {
    return new Sha512().put(bytes)
  }

  static half(...args: Uint8Array[]): Uint8Array {
    const hash = new Sha512()
    args.forEach((a) => hash.put(a))
    return hash.finish256()
  }

  put(bytes: Uint8Array): this {
    this.hash.update(bytes)
    return this
  }

  finish256(): Uint8Array {
    return Uint8Array.from(this.hash.digest().slice(0, 32))
  }

  finish(): IHash256 {
    return Hash256.fromBytes(this.finish256())
  }
}
