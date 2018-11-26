'use strict'

const { onCreateWebpackConfig } = require('./gatsby-node')

test('do nothing for non-produciton env', () => {
  const getConfig = jest.fn()
  onCreateWebpackConfig({ getConfig })
  expect(getConfig).not.toHaveBeenCalled()
})

test('update config for produciton env', () => {
  process.env.NODE_ENV = 'production'

  const getConfig = jest.fn(() => ({
    module: { rules: [] },
    output: {},
  }))
  onCreateWebpackConfig({
    getConfig,
    actions: { replaceWebpackConfig: jest.fn() },
  })
  expect(getConfig).toHaveBeenCalled()
})
