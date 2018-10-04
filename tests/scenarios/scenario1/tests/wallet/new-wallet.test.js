'use strict'

const utils = require('../../../../../lib/utils/test-utils')
const wallets = require('../../fixtures/wallets')

describe('New wallet which was sent transaction', () => {
  it('should have coins in the wallet', async () => {
    const response = await utils.request('GET', 'transactions')
    utils.expectSuccessful(response)
    
    const transactions = response.data.data.filter(transaction => transaction.recipient === wallets.newWallet1.address)
    expect(transactions.length).toBe(1) // 1 transaction was sent to this address
  })
})