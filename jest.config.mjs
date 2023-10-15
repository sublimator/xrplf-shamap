import tsJestPreset from 'ts-jest/jest-preset.js'

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const prettierPath = require.resolve('prettier-2')

const swcTransform = {
  '^.+\\.(t|j)sx?$': '@swc/jest'
}

const tsJestTransform = {
  '^.+\\.tsx?$': [
    'ts-jest',
    {
      tsconfig: 'tsconfig.json'
      // useESM: true
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
      transform,
      prettierPath,
      displayName: 'ts-jest',
      // extensionsToTreatAsEsm: ['.ts'],
      testPathIgnorePatterns: ['\\.puppeteer\\.test\\.ts$']
    }
  ]
})
