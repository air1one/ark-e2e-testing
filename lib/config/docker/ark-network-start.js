'use strict'

const options = {
    config: 'packages/core/lib/config/e2enet',
    network: 'e2enet',
    networkStart: true
}

require('packages/core/lib/start-relay-and-forger')(options)