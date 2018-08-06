'use strict'

const jest = require("jest")
const delay = require("delay")
const utils = require("./utils/test-utils")

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
  }

  async runTests() {
    await this.waitForNode(200) // 200 retries to wait for node to be up - can be long

    await this.executeTests()

    // Exiting with exit code = 1 if there are some failed tests - can be then picked up by Travis for example
    process.exitCode = this.failedTestSuites > 0
  }

  async waitForNode(retryCount) {
    if (retryCount === 0) throw 'Node is not responding'
    try {
      const response = await utils.request('GET', 'node/status')

      if(response.status !== 200) {
        await delay(1000)
        await this.waitForNode(--retryCount)
      }
    }
    catch (e) {
      await delay(1000)
      await this.waitForNode(--retryCount)
    }
  }

  async executeTests(blocksDone = []) {
    const configScenario = require('../tests/scenarii/' + this.scenario + '/config.js')
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
      console.log('[test-runner] New block : ' + blockHeight)
      const thingsToExecute = configuredBlockHeights.filter(key => key > lastBlockHeight && key <= blockHeight)
      
      // Quit if there are no more tests or actions waiting
      if (Math.max(...configuredBlockHeights) < blockHeight) { return }
      
      thingsToExecute.forEach(key => {
        const actionsPaths = configScenario.events.newBlock[key].actions
        const testsPaths = configScenario.events.newBlock[key].tests

        if(testsPaths) {
          testsPaths.forEach(testPath => {
            // now use Jest to launch the tests
            console.log('[test-runner] Executing test "' + testPath + '" for block ' + blockHeight)
            this.runJestTest(testPath)
          })
        }

        if (actionsPaths) {
          actionsPaths.forEach(actionPath => {
            console.log('[test-runner] Executing action "' + actionPath + '" for block ' + blockHeight)
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
      testPathPattern: ['tests\/scenarii\/' + this.scenario + '\/tests\/' + path.replace(/\//g,'\\/')]
    };

    jest
      .runCLI(options, options.projects)
      .then((success) => {
        console.log('[test-runner] Test "' + path + '" was run successfully');
        //console.log(success); //TODO save to a file

        this.failedTestSuites += success.results.numFailedTestSuites
      })
      .catch((failure) => {
        console.error('[test-runner] Error running test "' + path + '" : ' + failure);
      });
  }

  executeAction(actionPath) {
    require(`../tests/scenarii/${this.scenario}/actions/${actionPath}`)()
  }
}