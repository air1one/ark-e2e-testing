'use strict'

module.exports = {
    events: {
        newBlock: {
            5: { actions: ['blockchain/transaction.js'] },
            6: { actions: ['blockchain/doublespend-init.js'] },
            10: { tests: ['wallet/new-wallet.test.js'] },
            12: { actions: ['blockchain/doublespend.js'] }
        }
    }
}