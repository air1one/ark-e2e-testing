'use strict'

const options = {
    config: 'packages/core/lib/config/e2enet',
    network: 'e2enet',
    networkStart: true
}

console.log('[ark.js] Starting ark...')
require('packages/core/lib/start-relay-and-forger')(options)