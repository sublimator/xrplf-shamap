# xyzq-shapmah

Experimental SHAMap impl with support for PreHashed items.
Inner nodes can be represented as leaves on a tree with
an already computed hash as item.

This can be useful for building trees from minimal data where
you only care about a particular subset of the whole tree.
These subsets are "abbreviations".

### Incredulous Inners

On first approach this way of modeling (abbreviated) inners
as leaves can leave a bad taste in the mouth, but the definition
of a leaf is a terminal node in a tree, and that is the case
here. You can not descend further into these nodes.

- An inner node has 16 children
- A leaf node has an item
- An item can be either a Hashable or PreHashed

```typescript

export interface BytesSink {
  put(data: Uint8Array): void
}

export interface BytesSinkable {
  toSink: (sink: BytesSink) => void
}

export interface Hashable extends BytesSinkable {
  hashPrefix: () => Uint8Array
}

export interface PreHashed {
  type?: 'leaf' | 'inner'
  preHashed: HashT256
}

export type ShaMapItem = Hashable | PreHashed
```

### Indexes

To support abbreviated trees, there's no hard dependency on a 256 bit index:

```typescript
export interface PathIndex extends Hexed {
  nibbles: number

  nibble(n: number): number

  eq(leafIndex: PathIndex): boolean
}

export interface HashT256 extends BytesSinkable, Hexed, PathIndex {
  nibbles: 64

  eq(leafIndex: HashT256): boolean
}

export type FullIndex = HashT256

```

To query the map for a particular item (for example to prove it was in a tree)
you either need a full index, or a Path and Leaf hash:

```typescript
class ExShaMap {
  // ...
  getLeaf(index: FullIndex): ShaMapLeaf | undefined
  getLeaf(index: PathIndex, leafHash: HashT256): ShaMapLeaf | undefined
  getLeaf(index: PathIndex, leafHash?: HashT256): ShaMapLeaf | undefined {
    //...
  }
}
```

### Abbreviations

TODO:docs:more A minimal amount of data with which one can recreate a SHAMap hash

Implementations:

- See: src/shamap/nodes/ShaMap#abbreviated - accepts matcher callback
- See: src/shamap/nodes/ShaMap#abbreviatedWithOnly - single leaf
- See: src/shamap/nodes/ShaMap#abbreviatedIncluding - subtree

### Proofs

TODO:docs:more: Using trie serdes and abbreviated maps, create minimal proof of tx tree inclusion of tx

Implementations:

- See: src/proof/TxProofs/createTxProofs
- See: src/proof/TxProofs/checkTxProofTrie

### Trie Serializations

#### JSON tries

```json
{
  "CA6E8E69EDD8290C423985864B581E026028D6963713E8F3CA58D348BA50EABF": {
    "trie": {
      "0": "i656E81F91811228FD63C2302B084FFB99F5A711E1E9600C3F014FBBFCBF9E874",
      "1": "iA48003C7C0A5ACE19D559FFE3C492B967B78157E8234DE6E7EC96403EBA49C80",
      "2": "i24B7E86C456C7630C03B8738B5718E989F6FC5F345CDF18CB93327E0ACF3E20C",
      "3": "iE8E32B29F9F1EF65B44D294A1F1B872B14997A91D3548067242624F26623F421",
      "4": "i7D9B79970E6391FE45B2FA81C4444CF60C498C29D3A8BAA247B47281DC2431DE",
      "5": "i7BEEF59C48EC62BFC900B822B19E8FB1F79F31B59876D72885FC4B90B25C4FCB",
      "6": "iFBE0B09D9F748854A142A702727428D5B6191B601F5778B481D7933217F264CC",
      "7": "i5C8C15E76112ABA8BC30C1C98B1EEAD4AEFBCBBFFB0F178A1774A08E3592844B",
      "8": "i877CB226B1BA757D5F160BEED1C6FD62DE59D9051537CBE726144E391C14D98B",
      "9": "i3C10139729A4A1B8AFABA2DC0FD3682278834F4A97CD56C52747D9C58D61C63D",
      "A": "i8BB465ECB66048C40ABD0F9086BE4E3B3493E3A0D58463FC4822BD2130771C37",
      "B": "iD813E8F16268AF9F9355EDC8350C6A9C4808E5E2DB4FA54C9D7AC62AFDA63A1C",
      "C": {
        "2": "l1103D240C4BFE00ABECB23114B8A87D7ED4859C511BC812E474196D062CDEFA9",
        "9": "iE461AD9D6340062E8D4BD25737A29C2AEB0251BB7B0F5A01516E7BAD749BF8C7",
        "A": "lE833DFC67927EBF665DDB8E9FFBE93A62B5E3FB6B8880FB524474B935D0F4CDD"
      },
      "D": "l13A9092260A1E959B945CDF15759678F7721F74865263874F3AD63178D2EBB3F",
      "F": "lB58802E9537251C8B1C09B9F0850A4B3DFCC3A30D858CA5904BCFAB8A9D5508E"
    }
  }
}
```

Optionally prefixed with "type" character:

- `i` for inner
- `l` for leaf

They are, of course, by default not included.

#### Binary tries

I pondered a few ideas but for now settled on the idea of encoding
an inner node header of 4 bytes to encode the structure of its
child branches. With 32 bits, and 16 branches, that leaves 2 bits each.

4 possible values each. Hence:

1. Empty node
2. Inner node
3. PreHashed item - leaf or inner
    - Depending on initial header byte of trie, the first byte encodes the PreHashed#type (TODO: of debatable value)
    - In either case, the next fixed length 32 byte encodes the leaf item hash
4. Hashable item - you know the deal, a HashPrefix (i.e. DST) and some bytes
    - When this bit is set presumably you could use run length encoding ([see](src/utils/variableLength.ts))

We can then recreate the branch structure from the header, knowing
how to rebuild the map:

```typescript
class ExParser {
  * trieHeader(): Generator<[number, BranchType]> {
    const header = this.uInt32()
    for (let i = 0; i < 16; i++) {
      const type = header & (0b11 << (i * 2))
      yield [i, (type >>> (i * 2)) as BranchType]
    }
  }
}
```

Implementations:

- src/shamap/nodes/ShaMap#fromTrieBinary
- src/shamap/nodes/ShaMapInner#trieBinary

### Inspired by

Back in the day when searching for a bug via ledger replay, discovered
that loading ledger dumps via JSON was very slow, so had some
experience [tinkering with SHAMap structures](https://github.com/sublimator/ripple-lib-java/tree/master/ripple-core/src/main/java/com/ripple/core/types/shamap#rippled-nodestore)
in binary.

Had also pondered something similar to XPOP back in the day, so when
saw it, it really caught my attention:

1. https://github.com/RichardAH/xpop-generator
2. https://github.com/XRPLF/XRPL-Standards/discussions/107
3. https://github.com/RichardAH/xpop-verifier-py
4. https://github.com/Xahau/Validation-Ledger-Tx-Store-to-xPOP/blob/main/lib/xpop/v1.mjs

I thought that there was probably a more compact representation to be found,
hence these experiments going down this line:

1. Why not just rebuild the trees from just a flat list of index/hash?
2. Actually, why not just imply the indexes? An object trie?
3. Why not just use binary instead of JSON
4. ??
