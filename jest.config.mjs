import tsJestPreset from 'ts-jest/jest-preset.js'

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const prettierPath = require.resolve('prettier-2')

const useESM = false

const swcTransform = {
  '^.+\\.(t|j)sx?$': '@swc/jest'
}

const tsJestTransform = {
  '^.+\\.tsx?$': [
    'ts-jest',
    {
      tsconfig: 'tsconfig.json',
      useESM
    }
  ]
}

const USE_SWC = process.env.USE_SWC ?? true
const transform = USE_SWC ? swcTransform : tsJestTransform

export default ({
  preset: undefined,
  projects: [
    {
      ...tsJestPreset,
      displayName: 'ts-jest',
      transform,
      prettierPath,
      extensionsToTreatAsEsm: useESM ? ['.ts'] : undefined,
      testPathIgnorePatterns: ['\\.puppeteer\\.test\\.ts$']
    }
  ]
})
