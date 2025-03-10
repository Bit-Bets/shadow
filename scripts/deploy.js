const Betting = artifacts.require("Betting");

module.exports = async function(callback) {
    const initialBank = web3.utils.toWei("10", "ether");
    const maxBetAmount = web3.utils.toWei("1", "ether");
    const teamAName = "Team A";
    const teamBName = "Team B";
    
    try {
        const accounts = await web3.eth.getAccounts();
        const instance = await Betting.new(
            initialBank,
            maxBetAmount,
            teamAName,
            teamBName,

            { from: accounts[0] }
        );
        console.log('Contract deployed at address:', instance.address);
        callback();
    } catch (error) {
        console.error('Deployment failed:', error);
        callback(error);
    }
};
