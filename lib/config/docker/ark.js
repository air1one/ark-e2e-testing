'use strict'

const options = {
    config: 'lib/config/e2enet',
    network: 'e2enet',
    networkStart: false
}

console.log('[ark.js] Starting ark...')
require('packages/core/lib/start-relay-and-forger')(options)