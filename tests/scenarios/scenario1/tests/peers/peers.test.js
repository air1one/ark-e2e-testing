'use strict'

const utils = require('../../../../../lib/utils/test-utils')

describe('API 2.0 - Peers', () => {
  describe('GET /peers', () => {
    it('should be alive', async () => {
      const response = await utils.request('GET', 'peers')
      utils.expectSuccessful(response)
      
      const peers = response.data.data
      expect(peers.length).toBeGreaterThanOrEqual(2)

      const peerNode1 = peers.find((peer) => peer.ip === 'node1')
      expect(peerNode1).toBeDefined()
    })
  })
})