'use strict'

const { exec } = require('child_process');

/**
 * Disconnects the node node1 from the nodes network
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = (options) => {
  const command = 'container=$(docker ps -q -f "name=node1_ark-core") && docker network disconnect nodes ${container}'
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}