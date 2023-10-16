const xrpl = require('xrpl')

async function getLedgerData() {
  // Create a client instance
  const testNet = false
  const server = testNet
    ? 'wss://s.altnet.rippletest.net:51233'
    : 'wss://s1.ripple.com:443'

  const ledgerIndex = Number(process.argv[2] ?? 0) || 'validated'
  const client = new xrpl.Client(server)

  try {
    // Connect to the client
    await client.connect()

    const json = {}

    for (const getTx of [true, false]) {
      // Make a request to get the ledger
      const ledger = await client.request({
        command: 'ledger',
        ledger_index: ledgerIndex,
        transactions: getTx,
        expand: true,
        binary: getTx
      })

      // Access the transactions in binary format
      const transactionsBinary = ledger.result.ledger.transactions
      if (getTx) {
        json['transactions'] = transactionsBinary
        json['transaction_count'] = transactionsBinary.length
      } else {
        json['header'] = ledger.result.ledger
      }
    }

    console.log(JSON.stringify(json, null, 2))
  } catch (error) {
    console.error('An error occurred:', error)
  } finally {
    await client.disconnect()
  }
}

getLedgerData().catch(console.error)
