
const Web3 = require('web3');

async function loadAccount () {
    const web3 = await new Web3("ws://localhost:8545");
    const accounts = await web3.eth.getAccounts();
    console.log(accounts[0], "from loadAccount");
    return { web3js: web3, ownerAddress: accounts[0]};
}

module.exports = {
    loadAccount,
  };