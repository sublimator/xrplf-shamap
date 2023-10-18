export const BRANCH = {
  empty: 0,
  inner: 1,
  preHashed: 2, // simply hash of leaf or inner
  item: 3 // full item R.F.U for run length encoding
} as const

export const INCLUDE_PRE_HASHED_TYPE = 0b0001_0000 // 5th bit set

export type BranchType = (typeof BRANCH)[keyof typeof BRANCH]
