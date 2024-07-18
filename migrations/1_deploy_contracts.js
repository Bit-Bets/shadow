const Betting = artifacts.require("Betting");

module.exports = function (deployer) {
    const initialBank = web3.utils.toWei("10", "ether");
    const maxBetAmount = web3.utils.toWei("1", "ether");
    deployer.deploy(Betting, initialBank, maxBetAmount);
};
