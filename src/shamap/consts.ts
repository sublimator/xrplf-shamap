export const BRANCH = {
  empty: 0,
  inner: 1,
  preHashed: 2, // could be an elided inner masquerading as a leaf
  item: 3 // can't just
} as const

// TODO:  ValueOf<T>
export type BranchType = typeof BRANCH[keyof typeof BRANCH]
