const Betting = artifacts.require("Betting");

contract("Betting", accounts => {
    const [owner, bettor1, bettor2] = accounts;

    let bettingInstance;
    const initialBank = web3.utils.toWei("10", "ether");
    const maxBetAmount = web3.utils.toWei("1", "ether");
    const teamAName = "Team A";
    const teamBName = "Team B";

    beforeEach(async () => {
        bettingInstance = await Betting.new(
            initialBank,
            maxBetAmount,
            teamAName,
            teamBName
        );
    });

    it("should place bets correctly", async () => {
        const betAmount = web3.utils.toWei("0.5", "ether");

        await bettingInstance.placeBet(1, betAmount, { from: bettor1, value: betAmount });
        await bettingInstance.placeBet(2, betAmount, { from: bettor2, value: betAmount });

        const option1Amount = await bettingInstance.optionAmounts(1);
        const option2Amount = await bettingInstance.optionAmounts(2);

        assert.equal(option1Amount.toString(), betAmount);
        assert.equal(option2Amount.toString(), betAmount);
    });

    it("should set the winning option and distribute winnings correctly", async () => {
        const betAmount = web3.utils.toWei("0.5", "ether");

        // Place bets
        await bettingInstance.placeBet(1, betAmount, { from: bettor1, value: betAmount });
        await bettingInstance.placeBet(2, betAmount, { from: bettor2, value: betAmount });

        // Define the winning option
        await bettingInstance.setWinningOption(1, { from: owner });

        // Distribute winnings
        const initialBalanceBettor1 = web3.utils.toBN(await web3.eth.getBalance(bettor1));
        const initialBalanceBettor2 = web3.utils.toBN(await web3.eth.getBalance(bettor2));

        await bettingInstance.distributeWinnings({ from: owner });

        const finalBalanceBettor1 = web3.utils.toBN(await web3.eth.getBalance(bettor1));
        const finalBalanceBettor2 = web3.utils.toBN(await web3.eth.getBalance(bettor2));
        const contractBalance = await bettingInstance.getContractBalance();

        // Bettor1 should receive a payout
        assert(finalBalanceBettor1.gt(initialBalanceBettor1), "Bettor1 should have received a payout");

        // Bettor2 should not receive a payout
        assert.equal(finalBalanceBettor2.toString(), initialBalanceBettor2.toString(), "Bettor2 should not have received any payout");

        // Contract balance should be zero after payout
        assert.equal(contractBalance.toString(), '0', "Contract balance should be zero after payout");
    });

    it("should set the winning option and distribute winnings correctly", async () => {
        const betAmount = web3.utils.toWei("0.5", "ether");

        // Place bets
        await bettingInstance.placeBet(1, betAmount, { from: bettor1, value: betAmount });
        await bettingInstance.placeBet(2, betAmount, { from: bettor2, value: betAmount });

        // Define the winning option
        await bettingInstance.setWinningOption(1, { from: owner });

        // Log initial balances
        const initialBalanceBettor1 = web3.utils.toBN(await web3.eth.getBalance(bettor1));
        const initialBalanceBettor2 = web3.utils.toBN(await web3.eth.getBalance(bettor2));
        const initialContractBalance = web3.utils.toBN(await bettingInstance.getContractBalance());
        console.log("Initial Balance Bettor1:", web3.utils.fromWei(initialBalanceBettor1, "ether").toString());
        console.log("Initial Balance Bettor2:", web3.utils.fromWei(initialBalanceBettor2, "ether").toString());
        console.log("Initial Contract Balance:", web3.utils.fromWei(initialContractBalance, "ether").toString());

        // Distribute winnings
        await bettingInstance.distributeWinnings({ from: owner });

        // Log final balances
        const finalBalanceBettor1 = web3.utils.toBN(await web3.eth.getBalance(bettor1));
        const finalBalanceBettor2 = web3.utils.toBN(await web3.eth.getBalance(bettor2));
        const finalContractBalance = web3.utils.toBN(await bettingInstance.getContractBalance());

        console.log("Final Balance Bettor1:", web3.utils.fromWei(finalBalanceBettor1, "ether").toString());
        console.log("Final Balance Bettor2:", web3.utils.fromWei(finalBalanceBettor2, "ether").toString());
        console.log("Final Contract Balance:", web3.utils.fromWei(finalContractBalance, "ether").toString());

        // Get and log odds
        const oddsTeamA = await bettingInstance.viewOdds(1);
        const oddsTeamB = await bettingInstance.viewOdds(2);
        console.log("Odds Team A:", oddsTeamA.toString());
        console.log("Odds Team B:", oddsTeamB.toString());

        // Assertions
        assert(finalBalanceBettor1.gt(initialBalanceBettor1), "Bettor1 should have received a payout");
        assert.equal(finalBalanceBettor2.toString(), initialBalanceBettor2.toString(), "Bettor2 should not have received any payout");
        assert.equal(finalContractBalance.toString(), '0', "Contract balance should be zero after payout");
    });
});