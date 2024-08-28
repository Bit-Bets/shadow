const Betting = artifacts.require("Betting");

contract("Betting", (accounts) => {
    let bettingInstance;
    const owner = accounts[0];
    const bettor1 = accounts[1];
    const bettor2 = accounts[2];
    const initialBank = web3.utils.toWei("10", "ether");
    const maxBetAmount = web3.utils.toWei("1", "ether");
    const teamAName = "Team A";
    const teamBName = "Team B";
    const teamAProbability = 60;
    const teamBProbability = 40;

    beforeEach(async () => {
        bettingInstance = await Betting.new(
            initialBank,
            maxBetAmount,
            teamAName,
            teamBName,
            teamAProbability,
            teamBProbability,
            { from: owner }
        );
    });

    it("should deploy the contract with correct initial values", async () => {
        const contractOwner = await bettingInstance.owner();
        const bank = await bettingInstance.bank();
        const maxBet = await bettingInstance.maxBetAmount();
        const teamA = await bettingInstance.getTeamAName();
        const teamB = await bettingInstance.getTeamBName();
        const isActive = await bettingInstance.isActive();

        assert.equal(contractOwner, owner, "Owner is incorrect");
        assert.equal(bank.toString(), initialBank, "Initial bank is incorrect");
        assert.equal(maxBet.toString(), maxBetAmount, "Max bet amount is incorrect");
        assert.equal(teamA, teamAName, "Team A name is incorrect");
        assert.equal(teamB, teamBName, "Team B name is incorrect");
        assert.equal(isActive, true, "Contract should be active");
    });

    it("should allow a valid bet to be placed", async () => {
        await bettingInstance.placeBet(1, maxBetAmount, { from: bettor1, value: maxBetAmount });

        const optionAmount = await bettingInstance.optionAmounts(1);
        assert.equal(optionAmount.toString(), maxBetAmount, "Bet amount was not correctly recorded");

        const totalAmount = await bettingInstance.totalAmount();
        assert.equal(totalAmount.toString(), maxBetAmount, "Total amount was not correctly updated");

        const bank = await bettingInstance.bank();
        assert.equal(bank.toString(), web3.utils.toWei("9", "ether"), "Bank balance was not correctly updated");
    });

    it("should not allow an invalid bet to be placed", async () => {
        try {
            await bettingInstance.placeBet(3, maxBetAmount, { from: bettor1, value: maxBetAmount });
            assert.fail("Bet should not have been allowed with an invalid option");
        } catch (error) {
            assert(error.message.includes("Invalid option"), "Expected invalid option error");
        }
    });

    it("should distribute winnings correctly and deactivate the contract", async () => {
        await bettingInstance.placeBet(1, maxBetAmount, { from: bettor1, value: maxBetAmount });
        await bettingInstance.placeBet(2, maxBetAmount, { from: bettor2, value: maxBetAmount });

        await bettingInstance.distributeWinnings(1, { from: owner });

        const bettor1BalanceAfter = await web3.eth.getBalance(bettor1);
        const contractBalance = await bettingInstance.getContractBalance();
        const isActive = await bettingInstance.isActive();

        assert(contractBalance.toString(), "Contract balance should be zero after distribution");
        assert(isActive === false, "Contract should be deactivated after distribution");
        assert(bettor1BalanceAfter > maxBetAmount, "Bettor 1 did not receive correct payout");
    });

    it("should not allow betting after contract is deactivated", async () => {
        await bettingInstance.distributeWinnings(1, { from: owner });
        try {
            await bettingInstance.placeBet(1, maxBetAmount, { from: bettor1, value: maxBetAmount });
            assert.fail("Betting should not be allowed after contract is deactivated");
        } catch (error) {
            assert(error.message.includes("Contract is no longer active"), "Expected contract inactive error");
        }
    });

    it("should correctly calculate odds", async () => {
        await bettingInstance.placeBet(1, maxBetAmount, { from: bettor1, value: maxBetAmount });
        await bettingInstance.placeBet(2, maxBetAmount, { from: bettor2, value: maxBetAmount });

        const oddsTeamA = await bettingInstance.viewOdds(1);
        const oddsTeamB = await bettingInstance.viewOdds(2);

        assert(oddsTeamA.toString() !== "0", "Odds for Team A should not be zero");
        assert(oddsTeamB.toString() !== "0", "Odds for Team B should not be zero");
    });

    it("should allow owner to withdraw funds", async () => {
        const withdrawalAmount = web3.utils.toWei("1", "ether");
        await bettingInstance.withdrawFunds(withdrawalAmount, { from: owner });

        const bank = await bettingInstance.bank();
        assert.equal(bank.toString(), web3.utils.toWei("9", "ether"), "Bank balance did not update after withdrawal");
    });

    it("should not allow non-owner to withdraw funds", async () => {
        try {
            const withdrawalAmount = web3.utils.toWei("1", "ether");
            await bettingInstance.withdrawFunds(withdrawalAmount, { from: bettor1 });
            assert.fail("Non-owner should not be able to withdraw funds");
        } catch (error) {
            assert(error.message.includes("Only owner can call this function"), "Expected only owner error");
        }
    });
});
