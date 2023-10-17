export function ledgerIdent(ledger: {
  header: {
    ledger_index: string
  }
  server: string
}) {
  return `${ledger.server
    .split(':')[0] // remove port
    .split('.') // hops
    .reverse()
    .slice(0, 2) // take last 2
    .reverse()
    .join('.')}/${ledger.header.ledger_index}`
}
