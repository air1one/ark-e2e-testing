'use strict'

const axios = require('axios')
const bip39 = require('bip39')
const { client, transactionBuilder, crypto } = require('@arkecosystem/crypto')

/**
 * Creates a transaction to a new wallet
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async (options) => {
    const config = require('../../../../networks/test1/e2enet.json')
    client.setConfig(config)

    const delegates = require('../../../../networks/test1/delegates.json')
    const senderPassphrase = 'rebuild pupil visa matter cement area walnut resist type dumb outer issue'

    const passphrase = bip39.generateMnemonic()
    const keys = crypto.getKeys(passphrase)
    const address = crypto.getAddress(keys.publicKey, config.pubKeyHash)

    console.log(JSON.stringify({ passphrase, address }, null, 2))

    /*
    let transaction = transactionBuilder
      .transfer()
      .amount(1000 * Math.pow(10, 8))
      .recipientId(address)
      .vendorField('send coins to new wallet')
      .sign(senderPassphrase)
      .getStruct()*/

    let transaction = transactionBuilder.delegateRegistration()
        .usernameAsset('yo')
        .sign(senderPassphrase)
        .getStruct()

    await axios.post('http://127.0.0.1:4300/api/v2/transactions', {
      transactions: [transaction]
    })

    return transaction
}