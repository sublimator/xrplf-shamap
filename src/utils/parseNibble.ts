export function parseNibble(n: string | number) {
  return typeof n === 'string' ? parseInt(n, 16) : n
}
