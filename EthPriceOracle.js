const axios = require('axios')
const BN = require('bn.js')
const CoinGecko = require('coingecko-api');
const common = require('./utils/common.js')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './oracle/oracle_private_key'
const CHUNK_SIZE = process.env.CHUNK_SIZE || 3
const MAX_RETRIES = process.env.MAX_RETRIES || 5
const OracleJSON = require('./oracle/build/contracts/EthPriceOracle.json')
var pendingRequests = [];
var CoinGeckoClient;

async function getOracleContract (web3js) {
  const networkId = await web3js.eth.net.getId()
  return new web3js.eth.Contract(OracleJSON.abi, OracleJSON.networks[networkId].address)
}

async function filterEvents (oracleContract, web3js) {
  oracleContract.events.GetLatestEthPriceEvent(async (err, event) => {
    if (err) {
      console.error('Error on event', err)
      return
    }
    await addRequestToQueue(event)
  })

  oracleContract.events.SetLatestEthPriceEvent(async (err, event) => {
    if (err) console.error('Error on event', err)
    // Do something
  })
}

async function addRequestToQueue(event) {
  const callerAddress = event.returnValues.callerAddress;
  const id = event.returnValues.id;
  pendingRequests.push({callerAddress, id});
  console.log('Added request to queue', pendingRequests);
}

async function processQueue(oracleContract, ownerAddress) {
  let processedRequests = 0;
  while (pendingRequests.length > 0 && processedRequests < CHUNK_SIZE) {
      const req = pendingRequests.shift();
      await processRequest(oracleContract, ownerAddress, req.id, req.callerAddress);
      processedRequests++;
  }
}

async function processRequest(oracleContract, ownerAddress, id, callerAddress) {
  let retries = 0;
  while(retries < MAX_RETRIES) {
    try {
      const ethPrice = await GetETHPrice();
      console.log(ethPrice, "ethPrice");
      await setLatestEthPrice(oracleContract, callerAddress, ownerAddress, ethPrice, id);
      return;
    } catch (error) {
      console.log("palo con binance");
      if(retries === MAX_RETRIES - 1){
        await setLatestEthPrice(oracleContract, callerAddress, ownerAddress, '0', id);
        return;
      }
      retries++;
    }
  }
}

async function setLatestEthPrice (oracleContract, callerAddress, ownerAddress, ethPrice, id) {
  ethPrice = ethPrice.replace('.','');
  const multiplier = new BN(10**10, 10);
  const ethPriceInt = (new BN(parseInt(ethPrice), 10)).mul(multiplier)
  const idInt = new BN(parseInt(id))
  try {
    await oracleContract.methods.setLatestEthPrice(ethPriceInt.toString(), callerAddress, idInt.toString()).send({ from: ownerAddress })
  } catch (error) {
    console.log('Error encountered while calling setLatestEthPrice.')
    // Do some error handling
  }
}

async function GetETHPrice() {

  let resp = await CoinGeckoClient.simple.price({
      ids: 'ethereum',
      vs_currencies:'usd',
  });
  return resp.data.ethereum.usd;
}

async function init () {
  const {ownerAddress, web3js} = await common.loadAccount();
  const oracleContract = await getOracleContract(web3js);
  CoinGeckoClient = new CoinGecko();
  filterEvents(oracleContract, web3js);
  return {oracleContract, ownerAddress };
}

(async () => {
  const { oracleContract, ownerAddress } = await init();
  // process.on( 'SIGINT', () => {
  //   console.log('Calling client.disconnect()')
  //   client.disconnect();
  //   process.exit();
  // })
  setInterval(async () => {
    await processQueue(oracleContract, ownerAddress)
  }, SLEEP_INTERVAL)
})()