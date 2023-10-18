export const BRANCH = {
  empty: 0,
  inner: 1,
  preHashed: 2, // simply hash of leaf or inner
  item: 3 // full item R.F.U for run length encoding
} as const

export type BranchType = (typeof BRANCH)[keyof typeof BRANCH]
