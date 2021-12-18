
const Web3 = require('web3');
// const CoinGecko = require('coingecko-api');

async function loadAccount () {
    const web3 = await new Web3("ws://localhost:8545");
    const accounts = await web3.eth.getAccounts();
    console.log(accounts[0], "from loadAccount");
    return { web3js: web3, ownerAddress: accounts[0]};
}

// (async () => {
//     const CoinGeckoClient = new CoinGecko();
//     let resp = await CoinGeckoClient.simple.price({
//         ids: 'ethereum',
//         vs_currencies:'usd',
//     });
//     console.log(resp.data.ethereum);
//     return resp.data.ethereum.usd;
// })()

module.exports = {
    loadAccount,
  };