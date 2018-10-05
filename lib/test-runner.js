'use strict'

const jest = require("jest")
const delay = require("delay")
const utils = require("./utils/test-utils")
const path = require('path')
const fs = require('fs')

const util = require('util')
const exec = util.promisify(require('child_process').exec)

/**
 * Run the tests configured
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = async (options) => {
  console.log('[test-runner] Start');
  
  await (new TestRunner(options)).runTests()
}

class TestRunner {
  /**
   * Create a new test runner instance.
   * @param  {Object} options
   */
  constructor (options) {
    this.network = options.network
    this.scenario = options.scenario
    this.failedTestSuites = 0
    this.nodes = []
    this.rootPath = path.dirname('../')
    this.testResults = []
  }

  async runTests() {
    console.log('[test-runner] Waiting for node0 to be up on docker...')
    // wait for ark_node0 to be up + lerna.ok file to exist in dist/test1/node0/
    await this.waitForNode0Docker(240)

    // get the IP of all nodes to populate peers.json of each node
    console.log('[test-runner] Getting nodes info...')
    await this.getNodesInfo()
    console.log(JSON.stringify(this.nodes, null, 2))

    // launch the other nodes
    console.log('[test-runner] Launching nodes...')
    await this.launchNodes()

    console.log('[test-runner] Executing tests...')
    await this.executeTests()

    // write test results to a file
    fs.writeFileSync(`${this.rootPath}/test-results.log`, JSON.stringify(this.testResults, null, 2), 'utf8')

    // Exiting with exit code = 1 if there are some failed tests - can be then picked up by Travis for example
    process.exitCode = this.failedTestSuites > 0
  }

  async getNodesInfo() {
    // we assume there will be no more than 10 nodes
    for (const nodeNumber of Array(10).keys()) {
      const commandNodeUp = `docker ps | grep node${nodeNumber}_ark | grep Up | wc -l`
      const { stdout: stdoutNodeUp, stderr: stderrNodeUp } = await exec(commandNodeUp)
      if (stdoutNodeUp[0] === '0') {
        return
      }
      const commandDockerInspectNode = `docker ps --format "{{.Names}}" | grep node${nodeNumber}_ark | xargs docker inspect`
      const { stdout: stdoutDockerInspect, stderr: stderrDockerInspect } = await exec(commandDockerInspectNode)
      const nodeInspect = JSON.parse(stdoutDockerInspect)
      this.nodes[nodeNumber] = { name: `node${nodeNumber}`, IP: nodeInspect[0].NetworkSettings.Networks.nodes.IPAddress }
    }
  }

  async launchNodes() {
    for (let nodeNumber in this.nodes) {
      console.log(`[test-runner] Launching node${nodeNumber}...`)
      const nodeInfos = this.nodes[nodeNumber]

      // we configure for every node one peer being the last node we started
      console.log(`[test-runner] Updating node${nodeNumber} peer list...`)
      const IPPreviousNode = nodeNumber > 0 ? this.nodes[nodeNumber - 1].IP : this.nodes[0].IP // node0 will have himself as peer, no problem
      const commandPeerIP = `sed -i 's/<nodeIpPlaceholder>/${IPPreviousNode}/g' ${this.rootPath}/dist/${this.network}/${nodeInfos.name}/packages/core/lib/config/e2enet/peers.json`
      await exec(commandPeerIP)

      // now launch the node, with --network-start for node0
      console.log(`[test-runner] Launching node${nodeNumber}...`)
      const networkStart = nodeNumber > 0 ? '' : '--network-start '
      console.log(networkStart)
      const commandLaunch = `docker ps --format "{{.Names}}" | grep ${nodeInfos.name}_ark | xargs -I {} sh -c 'docker exec -d {} bash ark.sh'`
      console.log(`Executing: ${commandLaunch}`)
      await exec(commandLaunch)

      // wait for the node to be ready
      await this.waitForNode(nodeNumber, 30)
    }
  }

  async waitForNode0Docker(retryCount) {
    if (retryCount === 0) throw 'Node 0 is not up on Docker'
    try {
      const commandNode0Up = 'docker ps | grep node0_ark | grep Up | wc -l'
      const { stdout: stdoutNode0Up, stderr: stderrNode0Up } = await exec(commandNode0Up)
      if (stdoutNode0Up[0] === '0') {
        await delay(1000)
        await this.waitForNode0Docker(--retryCount)
      }

      const commandNodeModuleExists = `ls ${this.rootPath}/dist/${this.network}/node0 | grep lerna.ok | wc -l`
      const { stdout: stdoutNodeModuleExists, stderr: stderrNodeModuleExists } = await exec(commandNodeModuleExists)
      
      if (stdoutNodeModuleExists[0] !== '1') {
        await delay(1000)
        await this.waitForNode0Docker(--retryCount)
      }
    }
    catch (e) {
      console.log(e)
      await delay(1000)
      await this.waitForNode0Docker(--retryCount)
    }
  }

  async waitForNode(nodeNumber, retryCount) {
    if (retryCount === 0) throw 'Node is not responding'
    try {
      const response = await utils.request('GET', 'node/status', { port: 4300 + Number(nodeNumber) })

      if(response.status !== 200) {
        await delay(1000)
        await this.waitForNode(nodeNumber, --retryCount)
      }
    }
    catch (e) {
      await delay(1000)
      await this.waitForNode(nodeNumber, --retryCount)
    }
  }

  async executeTests(blocksDone = []) {
    const configScenario = require(`../tests/scenarios/${this.scenario}/config.js`)
    const configuredBlockHeights = Object.keys(configScenario.events.newBlock)

    const response = await utils.request('GET', 'blocks?limit=1')
    if(response.status !== 200) {
      throw 'Node is not responding'
    }

    const blockHeight = response.data.data[0].height
    const lastBlockHeight = blocksDone.length ? blocksDone[blocksDone.length -1] : blockHeight
    blocksDone.push(blockHeight)
    
    if(blockHeight > lastBlockHeight) {
      // new block !
      console.log(`[test-runner] New block : ${blockHeight}`)
      const thingsToExecute = configuredBlockHeights.filter(key => key > lastBlockHeight && key <= blockHeight)
      
      // Quit if there are no more tests or actions waiting
      if (Math.max(...configuredBlockHeights) < blockHeight) { return }
      
      thingsToExecute.forEach(key => {
        const actionsPaths = configScenario.events.newBlock[key].actions
        const testsPaths = configScenario.events.newBlock[key].tests

        if(testsPaths) {
          testsPaths.forEach(testPath => {
            // now use Jest to launch the tests
            console.log(`[test-runner] Executing test ${testPath} for block ${blockHeight}`)
            this.runJestTest(testPath)
          })
        }

        if (actionsPaths) {
          actionsPaths.forEach(actionPath => {
            console.log(`[test-runner] Executing action ${actionPath} for block ${blockHeight}`)
            this.executeAction(actionPath)
          })
        }
      })
    }

    await delay(2000)
    await this.executeTests(blocksDone)
  }

  runJestTest(path) {
    const options = {
      projects: [__dirname],
      silent: true,
      testPathPattern: ['tests\/scenarios\/' + this.scenario + '\/tests\/' + path.replace(/\//g,'\\/')]
    };

    jest
      .runCLI(options, options.projects)
      .then((success) => {
        console.log(`[test-runner] Test ${path} was run successfully`);
        this.testResults.push(success.results)

        this.failedTestSuites += success.results.numFailedTestSuites
      })
      .catch((failure) => {
        console.error(`[test-runner] Error running test ${path} : ${failure}`);
      });
  }

  executeAction(actionPath) {
    require(`../tests/scenarios/${this.scenario}/actions/${actionPath}`)()
  }
}
