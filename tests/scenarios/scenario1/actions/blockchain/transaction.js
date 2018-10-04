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
      .amount(1000 * Math.pow(10, 8))
      .recipientId(wallets.newWallet1.address)
      .vendorField('send coins to new wallet 1')
      .sign(wallets.genesisWallet.passphrase)
      .getStruct()

    let transaction2 = transactionBuilder.delegateRegistration()
        .usernameAsset('yo')
        .sign(wallets.genesisWallet.passphrase)
        .getStruct()

    await axios.post('http://127.0.0.1:4300/api/v2/transactions', {
      transactions: [transaction1, transaction2]
    })
}