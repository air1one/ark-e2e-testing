'use strict'

module.exports = {
    events: {
        newBlock: {
            5: { actions: ['blockchain/transaction.js'] },
            10: { tests: ['wallet/new-wallet.test.js'] }
        }
    }
}