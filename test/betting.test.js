const Betting = artifacts.require("Betting");

contract("Betting", (accounts) => {
    let bettingInstance;

    beforeEach(async () => {
        bettingInstance = await Betting.new(web3.utils.toWei("10", "ether"), web3.utils.toWei("1", "ether"));
    });

    it("should place a bet", async () => {
        await bettingInstance.placeBet(1, { from: accounts[1], value: web3.utils.toWei("0.5", "ether") });
        const betDetails = await bettingInstance.getBetDetails(0);
        
        assert.equal(betDetails[0], accounts[1], "The bettor address should match");
        assert.equal(betDetails[1].toString(), web3.utils.toWei("0.5", "ether"), "The bet amount should match");
        assert.equal(betDetails[2].toNumber(), 1, "The bet option should match");
    });

    it("should calculate the odds", async () => {
        await bettingInstance.placeBet(1, { from: accounts[1], value: web3.utils.toWei("0.5", "ether") });
        const odd = await bettingInstance.calculateOdd(1);
        const expectedOdd = web3.utils.toWei("20", "ether") / web3.utils.toWei("0.5", "ether");

        assert.equal(odd.toNumber(), expectedOdd, "The odd should be calculated correctly");
    });

    it("should not allow extravagant bets", async () => {
        try {
            await bettingInstance.placeBet(1, { from: accounts[1], value: web3.utils.toWei("2", "ether") });
            assert.fail("The bet should not be allowed");
        } catch (error) {
            assert.include(error.message, "Bet amount exceeds maximum allowed", "Expected error message");
        }
    });

    it("should distribute winnings", async () => {
        await bettingInstance.placeBet(1, { from: accounts[1], value: web3.utils.toWei("0.5", "ether") });
        await bettingInstance.placeBet(2, { from: accounts[2], value: web3.utils.toWei("0.5", "ether") });
        
        const initialBalance = web3.utils.toBN(await web3.eth.getBalance(accounts[1]));
        
        await bettingInstance.distributeWinnings(1, { from: accounts[0] });
        
        const finalBalance = web3.utils.toBN(await web3.eth.getBalance(accounts[1]));
        const expectedWinnings = web3.utils.toBN(web3.utils.toWei("20", "ether"));
        
        assert(finalBalance.sub(initialBalance).gte(expectedWinnings), "The winnings should be paid correctly");
    });

    it("should only allow the owner to distribute winnings", async () => {
        try {
            await bettingInstance.distributeWinnings(1, { from: accounts[1] });
            assert.fail("Only the owner should be able to distribute winnings");
        } catch (error) {
            assert.include(error.message, "Only owner can call this function", "Expected error message");
        }
    });
});
