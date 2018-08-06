'use strict'

const utils = require('../../../../../lib/utils/test-utils')

describe('API 2.0 - Node', () => {
  describe('GET /node/status', () => {
    it('should be alive', async () => {
      const response = await utils.request('GET', 'node/status')
      utils.expectSuccessful(response)
    })
  })
})