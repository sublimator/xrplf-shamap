import { beforeAll, describe, expect, it } from '@jest/globals'

import ledger40000 from './ledger-full-40000.json'
import ledger38129 from './ledger-full-38129.json'
import { BytesSink, FullIndex, Hashable } from '../src/types'
import { ShaMap } from '../src/shamap/ShaMap'
import { hashItem } from '../src/shamap/ShaMapItem'
import { accountItem, txItem } from './itemizers'
import { buildAbbreviatedMap } from '../src/shamap/buildAbbreviated'
import ledger1 from './ledger-testnet-binary-42089779.json'
import ledger2 from './ledger-binary-83258110.json'

import { transactionItemizer } from '../src/proof/proof'
import { TrieParser } from '../src/shamap/TrieParser'

function testTrie(items: [FullIndex, Hashable][], expectedHash: string) {
  const map = new ShaMap()
  for (const [index, item] of items) {
    map.addItem(index, item)
  }
  const trie = map.trieJSON()
  const fromTrie = ShaMap.fromTrieJSON(trie)
  expect(fromTrie.hash().toHex()).toBe(expectedHash)
  expect(map.hash().toHex()).toBe(expectedHash)
  return trie
}

describe('Known SHAMap hashes', () => {
  describe('should be able to recalculate an account state tree', () => {
    let items: [FullIndex, Hashable][]

    const expectedHash: string = ledger38129.account_hash

    beforeAll(() => {
      items = ledger38129.accountState.map(accountItem)
    })

    it('should be able to recalculate from item contents', () => {
      const map = new ShaMap()
      for (const [index, item] of items) {
        map.addItem(index, item)
      }
      expect(map.hash().toHex()).toBe(expectedHash)
    })

    it('should be able to build/rebuild tree from hashTrieJSON', () => {
      testTrie(items, expectedHash)
    })
  })

  describe.each([ledger38129, ledger40000])(
    'should be able to build an abbreviated tree for any item',
    ledger => {
      const MAX_TESTS = Infinity

      let full: ShaMap
      let items: [FullIndex, Hashable][] = ledger.accountState.map(accountItem)
      const expectedHash: string = ledger.account_hash

      beforeAll(() => {
        full = new ShaMap()
        for (const [index, item] of items) {
          full.addItem(index, item)
        }
      })
      it.each(items.slice(0, MAX_TESTS))(
        `abbreviated tree ledger ${ledger.ledger_index} index-%s`,
        (index, item) => {
          const hash = hashItem(index, item)
          const path = full.pathToLeaf(index)
          const abbr = buildAbbreviatedMap(path)
          expect(abbr.hash().toHex()).toBe(expectedHash)
          const trie = abbr.trieJSON()
          expect(trie).toMatchSnapshot()
          const fromTrie = ShaMap.fromTrieJSON(trie)
          expect(fromTrie.hash().toHex()).toBe(expectedHash)
          // The items don't have an index to be able to match by index
          expect(fromTrie.pathToLeaf(index).leaf).toBeUndefined()
          // But we can pass in a hash to match
          expect(fromTrie.pathToLeaf(index, hash).leaf).toBeDefined()
          expect(fromTrie.hasHashed(index, hash)).toBe(true)
        }
      )
    }
  )

  describe('should be able to recalculate a transaction tree', () => {
    let items: [FullIndex, Hashable][]

    const expectedHash = ledger38129.transaction_hash

    beforeAll(() => {
      items = ledger38129.transactions.map(txItem)
    })

    it('should be able to recalculate from item contents', () => {
      const map = new ShaMap()
      for (const [index, item] of items) {
        map.addItem(index, item)
      }
      expect(map.hash().toHex()).toBe(expectedHash)
    })

    it('should be able to recalculate from item hashes', () => {
      const short = new ShaMap()
      for (const [index, item] of items) {
        const hash = hashItem(index, item)
        short.addItem(index, { preHashed: hash })
      }
      expect(short.hash().toHex()).toBe(expectedHash)
    })

    it('should be able to build/rebuild tree from hashTrieJSON', () => {
      const trie = testTrie(items, expectedHash)
      expect(trie).toMatchInlineSnapshot(`
        {
          "3": "D42EE1686B347D14144A2398049A29E69BC3CF76140965EB1DAFC6BC351CA683",
        }
      `)
    })
  })
})

describe('should be able produce binary tries - transactions', () => {
  let items: [FullIndex, Hashable][]
  const expectedHash: string = ledger1.header.transaction_hash

  beforeAll(() => {
    items = ledger1.transactions.map(transactionItemizer)
  })

  it('should be able to recalculate from item contents', () => {
    const map = new ShaMap()
    for (const [index, item] of items) {
      map.addItem(index, item)
    }
    expect(map.hash().toHex()).toBe(expectedHash)

    expect(map.trieJSON()).toMatchInlineSnapshot(`
      {
        "0": "85EDB3AAE233DAF3586C1971BDB506D83FE3C01A2067A6ADCFC673C9FB2A04FA",
        "2": "4AB1B987E197EF882B732B6046C07E5AD48FD79C9FE0CC045AD33A34EFCDEC41",
        "3": "84060C55762EF6E725C89A1FC05816CF8D54376EAAFF5AE2F9CB1E4635AF7D10",
        "4": "3A83A6ED6F428D225A8EA81735784047AF8127E35345D5ADA41A72469D0310DF",
        "5": "7A93A718F9775B1D1BC556554D728E2C7E8280D2A9920106B8E445865CAE81A0",
        "9": "9E3DE394834F67D00760146FB98DDBFC5D1E62B07BAB0FEE06B0104F6CEFB7EE",
        "B": "767CB9A138D2261330818159FA284B4158C7B30907F75F2D3BB16AB35DBDDDE2",
        "C": "09E9DFCA2971BA64444BE553D6C5FBE2E3018E244DA2E0D5FBD835D11101D86E",
        "D": "5DF77E936CEB1709927EDECA0B5743EFB081E68616A709258EE746D1B1FB925E",
        "F": "5FEB5254C1AFCA4E9536899A1AC1A5FADBE12E96E3512CF34906DC62D20DA2C1",
      }
    `)

    expect(items.length).toBe(10)

    // 0 1 <
    // 1 0 <
    // 2 1 <
    // 3 1 <
    // 4 1 <
    // 5 1 <
    // 6 0 <
    // 7 0 <
    // 8 0 <
    // 9 1 <
    // A 0 <
    // B 1 <
    // C 1 <
    // D 1 <
    // E 0 <
    // F 1 <

    const bin = Buffer.from(map.headerBytes()).readUint32BE(0).toString(2)
    expect(bin).toMatchInlineSnapshot(`"1011101000111101"`)

    const buffers: Uint8Array[] = []
    const sink: BytesSink = {
      put(buf: Uint8Array) {
        // console.log('buf', buf.length)
        buffers.push(buf)
        return this
      }
    }
    map.trieBinary(sink)
    const trie = Buffer.concat(buffers)
    expect(trie.length).toBe(4 + 10 * 32)
    expect(
      Buffer.from(trie.subarray(0, 4)).readUint32BE(0).toString(2)
    ).toMatchInlineSnapshot(`"1011101000111101"`)
    expect(new TrieParser(trie).header().toString(2)).toMatchInlineSnapshot(
      `"1011101000111101"`
    )
    const parser = new TrieParser(trie)
    expect(Array.from(parser.parsedHeader())).toMatchInlineSnapshot(`
      [
        [
          0,
          false,
          false,
        ],
        [
          1,
          true,
          false,
        ],
        [
          2,
          false,
          false,
        ],
        [
          3,
          false,
          false,
        ],
        [
          4,
          false,
          false,
        ],
        [
          5,
          false,
          false,
        ],
        [
          6,
          true,
          false,
        ],
        [
          7,
          true,
          false,
        ],
        [
          8,
          true,
          false,
        ],
        [
          9,
          false,
          false,
        ],
        [
          10,
          true,
          false,
        ],
        [
          11,
          false,
          false,
        ],
        [
          12,
          false,
          false,
        ],
        [
          13,
          false,
          false,
        ],
        [
          14,
          true,
          false,
        ],
        [
          15,
          false,
          false,
        ],
      ]
    `)
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"85EDB3AAE233DAF3586C1971BDB506D83FE3C01A2067A6ADCFC673C9FB2A04FA"`
    )
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"4AB1B987E197EF882B732B6046C07E5AD48FD79C9FE0CC045AD33A34EFCDEC41"`
    )
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"84060C55762EF6E725C89A1FC05816CF8D54376EAAFF5AE2F9CB1E4635AF7D10"`
    )
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"3A83A6ED6F428D225A8EA81735784047AF8127E35345D5ADA41A72469D0310DF"`
    )
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"7A93A718F9775B1D1BC556554D728E2C7E8280D2A9920106B8E445865CAE81A0"`
    )
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"9E3DE394834F67D00760146FB98DDBFC5D1E62B07BAB0FEE06B0104F6CEFB7EE"`
    )
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"767CB9A138D2261330818159FA284B4158C7B30907F75F2D3BB16AB35DBDDDE2"`
    )
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"09E9DFCA2971BA64444BE553D6C5FBE2E3018E244DA2E0D5FBD835D11101D86E"`
    )
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"5DF77E936CEB1709927EDECA0B5743EFB081E68616A709258EE746D1B1FB925E"`
    )
    expect(parser.hash().toHex()).toMatchInlineSnapshot(
      `"5FEB5254C1AFCA4E9536899A1AC1A5FADBE12E96E3512CF34906DC62D20DA2C1"`
    )

    expect(parser.end()).toBe(true)
    //
    const retrie = ShaMap.fromTrieBinary(trie)
    expect(retrie.trieJSON()).toMatchInlineSnapshot(`
      {
        "0": "85EDB3AAE233DAF3586C1971BDB506D83FE3C01A2067A6ADCFC673C9FB2A04FA",
        "2": "4AB1B987E197EF882B732B6046C07E5AD48FD79C9FE0CC045AD33A34EFCDEC41",
        "3": "84060C55762EF6E725C89A1FC05816CF8D54376EAAFF5AE2F9CB1E4635AF7D10",
        "4": "3A83A6ED6F428D225A8EA81735784047AF8127E35345D5ADA41A72469D0310DF",
        "5": "7A93A718F9775B1D1BC556554D728E2C7E8280D2A9920106B8E445865CAE81A0",
        "9": "9E3DE394834F67D00760146FB98DDBFC5D1E62B07BAB0FEE06B0104F6CEFB7EE",
        "B": "767CB9A138D2261330818159FA284B4158C7B30907F75F2D3BB16AB35DBDDDE2",
        "C": "09E9DFCA2971BA64444BE553D6C5FBE2E3018E244DA2E0D5FBD835D11101D86E",
        "D": "5DF77E936CEB1709927EDECA0B5743EFB081E68616A709258EE746D1B1FB925E",
        "F": "5FEB5254C1AFCA4E9536899A1AC1A5FADBE12E96E3512CF34906DC62D20DA2C1",
      }
    `)
    expect(retrie.hash().toHex()).toBe(expectedHash)
  })
})

function getBinaryTrie(map: ShaMap) {
  const buffers: Uint8Array[] = []
  const sink: BytesSink = {
    put(buf: Uint8Array) {
      // console.log('buf', buf.length)
      buffers.push(buf)
      return this
    }
  }
  map.trieBinary(sink)
  return Buffer.concat(buffers)
}

describe(`should be able produce binary tries - ledger ${ledger2.header.ledger_index}`, () => {
  let items: [FullIndex, Hashable][]
  const expectedHash: string = ledger2.header.transaction_hash

  beforeAll(() => {
    items = ledger2.transactions.map(transactionItemizer)
  })

  it('should be able to recalculate from item contents', () => {
    const map = new ShaMap()
    for (const [index, item] of items) {
      map.addItem(index, item)
    }
    expect(map.hash().toHex()).toBe(expectedHash)

    expect(items.length).toBe(40)
    expect(JSON.stringify(map.trieJSON()).length).toMatchInlineSnapshot(`2925`)

    const trie = getBinaryTrie(map) //
    expect(trie.length).toMatchInlineSnapshot(`1340`)
    const retrie = ShaMap.fromTrieBinary(trie)
    expect(retrie.trieJSON()).toMatchInlineSnapshot(`
      {
        "0": {
          "1": "4B8B974D305E2EAAF4FD62C3FB0ABFF40D0A704E64383C22D7DF1BD14CC6E9BF",
          "4": "9B4740ED730DD50FFC8E495BE2BD655B33E3243BE75E00D4B62A625F7C23D0FB",
          "6": "8C4D44E458310C7BB2786860EF8F23E57A1A860560D78E61809D58FD97032D61",
          "B": "9E72577DE039B7E504F39A5EFE4C32C708D37F642C19148B9EDA97208EA46ACA",
        },
        "1": {
          "2": "BA2A2949F15450F8793FE7270ACD471A219B0F1EDD06FFAA016060806029F54D",
          "5": "C2E4949450A8001F70AC96A4B819641E34C50B73EDF04E330A49F7D0D926EBA6",
          "E": "C85353F7A7280E0BD6DEFDCC82175A6AA24AA4A3FA489AC50F26418A6542503C",
        },
        "2": {
          "1": "217AA60DB36A7FDA546D47DB6193AA8B93EA0E957A2ABADABCF0915319EA9815",
          "4": "6D5773EA06F72D6DEDD31BA08A667FD86674F276911135E54DE7324A7D68F38D",
          "A": "593F642A45F037D1CFD31329BD145562CE9A54210E9116605ABFAEE5A8CA9C1E",
        },
        "3": {
          "1": "9F564E4E7B03D05CCE3E77186D754364F52D3A34B00112915A95729810BA1342",
          "6": "F9BC40D12BD29203C8B9C930A6922873A0BEBB9187B14BC7A0A2044C1813304C",
          "9": "E4C1D9D260D94DF4693B5CCABD4ECB008451E62FF55EA18E17EEAA5629369C01",
        },
        "4": {
          "2": "6B14A6DEBB09B263E4F840205E27B8091D4E9E8DAC0983C44DCA8A7F71E20CA0",
          "B": "51F14D7684C2306E036DC80F0874B0072FD5082818C7DA8206E0D2B23454E2E3",
        },
        "5": {
          "1": "ABA0B324052F2E794427C993B100DE68E1563A9F2F4BCC2B527B08E0E1F5BF3C",
          "5": "BF477C6AFE7A2F3C73C462201D37711433BFF35B0F3290DAEFDA7B58F00D1CF4",
          "E": "F712C0EE8C6D158E5376CCDD913E0FA8C1B6C66124CA2D81CB55D901215ADB6C",
        },
        "6": {
          "2": "D54E8AAA48A035CFBE4817DDFB8CEB6D0BFD79C6852A2A32491143F29DCF36D7",
          "B": "B6BFDFC4E76D0501D522AC766E281FC3AD5FD17D32C28C19C5E109D467C01F82",
        },
        "7": {
          "0": "AA84418854F62C6E365D00165DAE79D79B3014BE055141E28027F013B3DA992D",
          "B": "601C0DD134847F7E6B71CCA4F82BA31EC5D68190A882C61C54A954E4D2EDB662",
        },
        "8": {
          "0": "1DA8FC601EE3DADB93667FB434F63B7F7D49A5D3CFDD22099586DCC2E43D7B3E",
          "8": "477AC60C8050B1AA3D7F8BED48D2CE94955A79414DB64E66E310FD865F2C4971",
        },
        "9": {
          "0": "AEAD33EA4F2B1B8FB1EFD9833924DBC21054A5DFE9B69F2A402F1C3F911DADDA",
          "9": "28426894718B08D7DDE0614CFFDABF997A8FA51DF0F0EB122B6FCC3DEA594467",
          "C": "1BD451C54CE21A15167223CD259A44B28227C8F1A733017C36C820053B1DAD42",
        },
        "A": {
          "3": "5DCDCE9044A4541D302CCAA5019795BB60C3F0543B20EDACD136E293B6112B4D",
          "5": "B79BA7C6614121C94295397EDB3B236654883F28C3F19AA287A83FDAC823FA72",
          "A": "10CC43B3945ED29C18516B51AB882C1AF6DDAE3910D5CDA40777E785AC642938",
          "C": "11D30F7821632A009D3F2C352B6E4AEFAF675BC31836BAFD29880D742C5279DC",
        },
        "B": {
          "0": "977282D09B9768FCA858AFEF6405A9880B01468975CA8ED3F9414D93A4214E83",
          "1": "47F5DA0B60C6E804F39516329739F5CBD94615513C5A69F5B238AEB0BA591F23",
          "9": "EBD8AF4FD1C10B369C1BF2DFB0D1B44392958EEFC5BFF47917FDA65333A2AB7A",
        },
        "C": {
          "2": "1103D240C4BFE00ABECB23114B8A87D7ED4859C511BC812E474196D062CDEFA9",
          "9": {
            "0": "C8370CE80ACB66ACABBA2209BF783488AB4B62B1B43F5294D58C81FE9CEA7EEE",
            "5": "3C6D50D39612D1ADE57D6885844B3D3408130C6D95154CB95CFF7196657E2BDA",
          },
          "A": "E833DFC67927EBF665DDB8E9FFBE93A62B5E3FB6B8880FB524474B935D0F4CDD",
        },
        "D": "13A9092260A1E959B945CDF15759678F7721F74865263874F3AD63178D2EBB3F",
        "F": "B58802E9537251C8B1C09B9F0850A4B3DFCC3A30D858CA5904BCFAB8A9D5508E",
      }
    `)
    expect(retrie.hash().toHex()).toBe(expectedHash)

    const abbrevLeaf = items[14][0]
    const bin = getBinaryTrie(buildAbbreviatedMap(map.pathToLeaf(abbrevLeaf)))
    expect(bin.length).toMatchInlineSnapshot(`520`)
    expect(ShaMap.fromTrieBinary(bin).hash().toHex()).toBe(expectedHash)
  })
})
