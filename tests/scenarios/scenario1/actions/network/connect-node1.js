'use strict'

const { exec } = require('child_process');

/**
 * Connects the node node1 to the nodes network
 * @param  {Object} options = { }
 * @return {void}
 */
module.exports = (options) => {
  const command = 'container=$(docker ps -q -f "name=node1_ark-core") && docker network connect --alias node1 nodes ${container}'
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}