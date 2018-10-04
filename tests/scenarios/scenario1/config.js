'use strict'

module.exports = {
    events: {
        newBlock: {
            /*423: { tests: ['node/node.test.js', 'peers/peers.test.js'] },
            132: { actions: ['network/rm-stack-node1.js'] },
            246: { tests: ['peers/peers.test.js'] }*/
            5: { actions: ['blockchain/transaction.js'] },
            10: { tests: ['wallet/new-wallet.test.js'] }
        }
    }
}