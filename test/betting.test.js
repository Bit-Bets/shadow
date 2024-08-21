const Betting = artifacts.require("Betting");

contract("Betting", (accounts) => {
    let betting;
    const [owner, bettor1, bettor2] = accounts;
    let bettingInstance;

    beforeEach(async () => {
        bettingInstance = await Betting.new(web3.utils.toWei("10", "ether"), web3.utils.toWei("1", "ether"));
        betting = await Betting.new(web3.utils.toWei("10", "ether"), web3.utils.toWei("2", "ether"), { from: owner });
    });

    it("should place a bet", async () => {
        await bettingInstance.placeBet(1, { from: accounts[1], value: web3.utils.toWei("0.5", "ether") });
        const betDetails = await bettingInstance.getBetDetails(0);
        
        assert.equal(betDetails[0], accounts[1], "The bettor address should match");
        assert.equal(betDetails[1].toString(), web3.utils.toWei("0.5", "ether"), "The bet amount should match");
        assert.equal(betDetails[2].toNumber(), 1, "The bet option should match");
    });

    it("should calculate the odds after placing two bets on option 1 and one bet on option 2", async () => {
        // Fazer a primeira aposta na opção 1
        await bettingInstance.placeBet(1, { from: accounts[1], value: web3.utils.toWei("0.5", "ether") });
    
        // Fazer a segunda aposta na opção 1
        await bettingInstance.placeBet(1, { from: accounts[2], value: web3.utils.toWei("0.5", "ether") });
    
        // Fazer a terceira aposta na opção 2
        await bettingInstance.placeBet(2, { from: accounts[3], value: web3.utils.toWei("0.5", "ether") });
    
        // Obter o saldo do banco e o total apostado após as apostas
        const bankAfterBets = await bettingInstance.bank();
        const totalAmountAfterBets = await bettingInstance.totalAmount();
    
        // Converter valores para BN para operações matemáticas
        const bankBN = web3.utils.toBN(bankAfterBets);
        const totalAmountBN = web3.utils.toBN(totalAmountAfterBets);
    
        // Valores apostados em cada opção
        const totalBetAmountOption1BN = web3.utils.toBN(web3.utils.toWei("1", "ether")); // 0.5 ether + 0.5 ether
        const betAmountOption2BN = web3.utils.toBN(web3.utils.toWei("0.5", "ether"));
    
        // Calcular a odd esperada para a opção 1 usando BN
        const expectedOddOption1BN = totalAmountBN.add(bankBN).div(totalBetAmountOption1BN);
    
        // Calcular a odd esperada para a opção 2 usando BN
        const expectedOddOption2BN = totalAmountBN.add(bankBN).div(betAmountOption2BN);
    
        // Obter as odds calculadas pelo contrato para as opções 1 e 2
        const oddOption1 = await bettingInstance.calculateOdd(1);
        const oddOption2 = await bettingInstance.calculateOdd(2);
    
        // Prints para verificação
        console.log("ODD calculada pelo contrato para a opção 1:", oddOption1.toString());
        console.log("ODD calculada pelo contrato para a opção 2:", oddOption2.toString());
        console.log("Bank after bets (BN):", bankBN.toString());
        console.log("Total amount after bets (BN):", totalAmountBN.toString());
        console.log("Expected odd for option 1 (BN):", expectedOddOption1BN.toString());
        console.log("Expected odd for option 2 (BN):", expectedOddOption2BN.toString());
    
        // Verificar se as odds são iguais às esperadas
        assert.equal(oddOption1.toString(), expectedOddOption1BN.toString(), "The odd for option 1 should be calculated correctly");
        assert.equal(oddOption2.toString(), expectedOddOption2BN.toString(), "The odd for option 2 should be calculated correctly");
    });
    
    
    
    it("should not allow extravagant bets", async () => {
        try {
            await bettingInstance.placeBet(1, { from: accounts[1], value: web3.utils.toWei("2", "ether") });
            assert.fail("The bet should not be allowed");
        } catch (error) {
            assert.include(error.message, "Bet amount invalid or exceeds limits", "Expected error message");
        }
    });

    it("should distribute winnings correctly", async () => {
        // Bettor1 bets on option 1
        await betting.placeBet(1, { from: bettor1, value: web3.utils.toWei("1", "ether") });
        // Bettor2 bets on option 2
        await betting.placeBet(2, { from: bettor2, value: web3.utils.toWei("1", "ether") });
    
        // Owner distributes winnings for option 1
        await betting.distributeWinnings(1, { from: owner });
    
        // Verify bettor1 received payout
        const bettor1Balance = await web3.eth.getBalance(bettor1);
        assert(bettor1Balance > web3.utils.toWei("101", "ether"), "Bettor1 did not receive correct payout");
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
