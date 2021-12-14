const CallerContract = artifacts.require("CallerContract");
var expect = require('chai').expect;

contract("CallerContract", (accounts) => {
    let [alice, bob] = accounts;
    let contractInstance;

    beforeEach(async () => {
        contractInstance = await CallerContract.new();
    });
    it("first", async () => {
        const result = await contractInstance.setOracleInstanceAddress(alice);

        expect(result.receipt.status).to.equal(true);
    })
    it("second", async () => {
        const result = await contractInstance.updateEthPrice();

        expect(result.receipt.status).to.equal(true);
    })
})