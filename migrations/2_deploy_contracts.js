const Betting = artifacts.require("Betting");

module.exports = function (deployer) {
  // Defina os parâmetros para o construtor do contrato
  const initialBank = web3.utils.toWei("10", "ether"); // 10 ETH como valor inicial do banco
  const maxBetAmount = web3.utils.toWei("1", "ether"); // 1 ETH como valor máximo de aposta
  const teamAName = "Team A";
  const teamBName = "Team B";

  // Deploy do contrato Betting com os parâmetros do construtor
  deployer.deploy(
    Betting,
    initialBank,
    maxBetAmount,
    teamAName,
    teamBName
  );
};
