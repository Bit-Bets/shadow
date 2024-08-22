const Betting = artifacts.require("Betting");

module.exports = async function (deployer) {
  const initialBank = web3.utils.toWei('10', 'ether'); // Valor de exemplo
  const maxBetAmount = web3.utils.toWei('1', 'ether'); // Valor de exemplo
  
  await deployer.deploy(Betting, initialBank, maxBetAmount);
};
