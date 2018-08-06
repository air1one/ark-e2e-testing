'use strict'

const path = require('path')
const fs = require('fs')
const git = require('nodegit')

const gitUrl = 'https://github.com/air1one/core'
const gitOptions = { checkoutBranch: 'fix-redis-config' }

/**
 * Generates folder structure and files from network configuration
 * @param  {Object} options = { network: 'test1', nodes: 3 }
 * @return {void}
 */
module.exports = async (options) => {
  console.log('start');
  
  (new GenerateManager(options)).generate()
  
  
}

class GenerateManager {
  /**
   * Create a new generate manager instance.
   * @param  {Object} options
   */
  constructor (options) {
    this.network = options.network
    
    const nodes = []
    for (let i = 0; i < options.nodes ; i++) {
      nodes.push('node' + i)
    }
    this.nodes = nodes

    this.rootPath = path.dirname('../')
  }

  async generate() {
    await this.clone()
    this.createFiles()
  }

  async clone() {
    const clonePromises = []
    this.nodes.forEach( (node) => {
      const nodePath = path.join(this.rootPath, 'dist', this.network, node)
  
      clonePromises.push(git.Clone(gitUrl, nodePath, gitOptions))
      
    })

    await Promise.all(clonePromises)
    console.log('çlones ok ! ');
  }

  createFiles() {
    const thisNetworkPath = path.join(this.rootPath, 'tests/networks', this.network)
    const thisDockerPath = path.join(this.rootPath, 'lib/config/docker')

    const delegates = JSON.parse(fs.readFileSync(path.join(thisNetworkPath, 'delegates.json'), 'utf8'));

    this.nodes.forEach( (node, index) => {
      const distNodePath = path.join(this.rootPath, 'dist', this.network, node)
      const distCoreNetworkPath = path.join(distNodePath, 'packages/core/lib/config/e2enet')
      const distCryptoNetworkPath = path.join(distNodePath, 'packages/crypto/lib/networks/ark')
      const distDockerPath = path.join(distNodePath, 'docker/testnet') //TODO create our own folder

      fs.mkdir(distCoreNetworkPath, (err) => {
        if (err) {
           return console.error(err);
        }
        console.log("Directory created successfully!");

        fs.createReadStream(path.join(thisNetworkPath, 'plugins.js'))
            .pipe(fs.createWriteStream(path.join(distCoreNetworkPath, 'plugins.js')))
        
        fs.createReadStream(path.join(thisNetworkPath, 'peers.json'))
        .pipe(fs.createWriteStream(path.join(distCoreNetworkPath, 'peers.json')))

        fs.createReadStream(path.join(thisNetworkPath, 'genesisBlock.json'))
            .pipe(fs.createWriteStream(path.join(distCoreNetworkPath, 'genesisBlock.json')))
    
        fs.createReadStream(path.join(thisNetworkPath, 'e2enet.json'))
        .pipe(fs.createWriteStream(path.join(distCryptoNetworkPath, 'e2enet.json')))

        fs.createReadStream(path.join(thisNetworkPath, 'index.js'))
        .pipe(fs.createWriteStream(path.join(distCryptoNetworkPath, 'index.js')))
        
        fs.createReadStream(path.join(thisDockerPath, 'docker-compose-stack.yml'))
        .pipe(fs.createWriteStream(path.join(distDockerPath, 'docker-compose-stack.yml')))

        fs.createReadStream(path.join(thisDockerPath, 'docker-compose-build.yml'))
        .pipe(fs.createWriteStream(path.join(distDockerPath, 'docker-compose.yml')))

        fs.createReadStream(path.join(thisDockerPath, 'entrypoint.sh'))
        .pipe(fs.createWriteStream(path.join(distDockerPath, 'entrypoint.sh')))

        // need to rework delegates.json to distribute them among the nodes
        const nodeDelegates = Object.assign({}, delegates)
        const chunkSize = Math.ceil(delegates.secrets.length / this.nodes.length)
        nodeDelegates.secrets = delegates.secrets.slice(index * chunkSize, (index + 1) * chunkSize)
        fs.writeFile(path.join(distCoreNetworkPath, 'delegates.json'),
            JSON.stringify(nodeDelegates, null, 2),
            (err) => {
              if (err) throw err;
              console.log('delegates saved!');
        })

        console.log('file copy ok ! ', node);
      });

      
  
  
    })

    fs.createReadStream(path.join(thisDockerPath, 'docker-init.sh'))
        .pipe(fs.createWriteStream(path.join(this.rootPath, 'dist', this.network, 'docker-init.sh')))

    fs.createReadStream(path.join(thisDockerPath, 'docker-start.sh'))
        .pipe(fs.createWriteStream(path.join(this.rootPath, 'dist', this.network, 'docker-start.sh')))
  }

}