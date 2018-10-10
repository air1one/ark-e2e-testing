'use strict'

const axios = require('axios')
const bip39 = require('bip39')
const { client, transactionBuilder, crypto } = require('@arkecosystem/crypto')
const wallets = require('../../fixtures/wallets')

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async (options) => {
    const config = require('../../../../networks/test1/e2enet.json')
    client.setConfig(config)

    let transaction1 = transactionBuilder
      .transfer()
      .amount(600 * Math.pow(10, 8))
      .recipientId(wallets.doubleSpendRecipient.address)
      .vendorField('first part of double spend')
      .sign(wallets.doubleSpendSender.passphrase)
      .getStruct()

    let transaction2 = transactionBuilder
      .transfer()
      .amount(600 * Math.pow(10, 8))
      .recipientId(wallets.doubleSpendRecipient.address)
      .vendorField('second part of double spend')
      .sign(wallets.doubleSpendSender.passphrase)
      .getStruct()

    await axios.post('http://127.0.0.1:4300/api/v2/transactions', {
      transactions: [transaction1, transaction2]
    })
}