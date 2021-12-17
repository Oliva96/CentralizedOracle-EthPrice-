const common = require('./utils/common.js')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 5000
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './caller/caller_private_key'
const CallerJSON = require('./caller/build/contracts/CallerContract.json')
const OracleJSON = require('./oracle/build/contracts/EthPriceOracle.json')

async function getCallerContract (web3js) {
  const networkId = await web3js.eth.net.getId();
  return new web3js.eth.Contract(CallerJSON.abi, CallerJSON.networks[networkId].address);
}

async function retrieveLatestEthPrice () {
  const resp = await axios({
    url: 'https://api.binance.com/api/v3/ticker/price',
    params: {
      symbol: 'ETHUSDT'
    },
    method: 'get'
  })
  return resp.data.price
}

async function filterEvents (callerContract) {
  callerContract.events.PriceUpdatedEvent({ filter: { } }, async (err, event) => {
    if (err) console.error('Error on event', err);
    console.log('* New PriceUpdated event. ethPrice: ' + event.returnValues.ethPrice);
  })
  callerContract.events.ReceivedNewRequestIdEvent({ filter: { } }, async (err, event) => {
    if (err) console.error('Error on event', err);
  })
}

async function init () {
  const { ownerAddress, web3js } = await common.loadAccount();
  const callerContract = await getCallerContract(web3js);
  filterEvents(callerContract);
  return { callerContract, ownerAddress, web3js };
}

(async () => {
  const { callerContract, ownerAddress, web3js } = await init();
  // process.on( 'SIGINT', () => {
  //   console.log('Calling client.disconnect()');
  //   client.disconnect();
  //   process.exit();
  // })
  const networkId = await web3js.eth.net.getId();
  const oracleAddress =  OracleJSON.networks[networkId].address;
  await callerContract.methods.setOracleInstanceAddress(oracleAddress).send({ from: ownerAddress });
  let i = 0;
  setInterval( async () => {
    await callerContract.methods.updateEthPrice().send({from: ownerAddress, gas: 2000000});
    console.log(i++, "calls");
  }, SLEEP_INTERVAL);
})()
