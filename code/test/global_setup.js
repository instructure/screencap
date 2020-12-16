const { setup: setupDevServer } = require("jest-dev-server");

module.exports = async function globalSetup() {
  await setupDevServer({
    command: `node test/sampleServer.js`,
    launchTimeout: 50000,
    port: 2001,
  });
};
