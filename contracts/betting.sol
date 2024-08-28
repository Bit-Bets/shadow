// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Betting {
    struct Bet {
        address bettor;
        uint amount;
        uint option; // 1 para o time A, 2 para o time B
    }

    address public owner;
    mapping(uint => uint) public optionAmounts; // Armazena valores apostados para as opções de times
    Bet[] public bets;
    uint public totalAmount;
    uint public bank;
    uint public maxBetAmount;
    string public teamAName;
    string public teamBName;
    uint public teamAProbability;
    uint public teamBProbability;
    bool public isActive; // Novo estado para indicar se o contrato está ativo

    event BetPlaced(address indexed bettor, uint amount, uint option);
    event Payout(address indexed bettor, uint amount);

    constructor(
        uint initialBank,
        uint _maxBetAmount,
        string memory _teamAName,
        string memory _teamBName,
        uint _teamAProbability,
        uint _teamBProbability
    ) {
        require(initialBank > 0, "Initial bank must be greater than zero");
        require(_maxBetAmount > 0, "Max bet amount must be greater than zero");
        require(bytes(_teamAName).length > 0 && bytes(_teamBName).length > 0, "Team names must be provided");
        require(_teamAProbability + _teamBProbability == 100, "Probabilities must sum to 100");

        owner = msg.sender;
        bank = initialBank;
        maxBetAmount = _maxBetAmount;
        teamAName = _teamAName;
        teamBName = _teamBName;
        teamAProbability = _teamAProbability;
        teamBProbability = _teamBProbability;
        isActive = true; // Define o contrato como ativo inicialmente
    }

    modifier onlyActive() {
        require(isActive, "Contract is no longer active");
        _;
    }

    function placeBet(uint option, uint betAmount) public payable onlyActive {
        require(option == 1 || option == 2, "Invalid option");
        require(betAmount > 0 && betAmount <= maxBetAmount && betAmount <= bank, "Bet amount invalid or exceeds limits");

        optionAmounts[option] += betAmount;
        totalAmount += betAmount;
        bank -= betAmount;

        Bet memory newBet = Bet({
            bettor: msg.sender,
            amount: betAmount,
            option: option
        });

        bets.push(newBet);

        emit BetPlaced(msg.sender, betAmount, option);
    }

    function distributeWinnings(uint winningOption) public onlyOwner onlyActive {
        uint winningAmount = optionAmounts[winningOption];
        require(winningAmount > 0, "No bets placed on this option");

        uint totalPayout = 0;
        Bet[] memory winners = new Bet[](bets.length);
        uint winnerCount = 0;

        for (uint i = 0; i < bets.length; i++) {
            if (bets[i].option == winningOption) {
                uint payout = (bets[i].amount * calculateOdd(winningOption)) / 1e18;
                winners[winnerCount] = bets[i];
                winnerCount++;
                totalPayout += payout;
            }
        }

        require(totalPayout <= bank, "Bank has insufficient funds");

        for (uint i = 0; i < winnerCount; i++) {
            uint payout = (winners[i].amount * calculateOdd(winningOption)) / 1e18;
            payable(winners[i].bettor).transfer(payout);
            emit Payout(winners[i].bettor, payout);
        }

        totalAmount = 0;
        for (uint i = 0; i < bets.length; i++) {
            optionAmounts[bets[i].option] = 0;
        }
        delete bets;
        bank = address(this).balance;

        isActive = false; // Torna o contrato inutilizável após a distribuição dos ganhos
    }

    function calculateOdd(uint option) internal view returns (uint) {
        require(optionAmounts[option] > 0, "No bets placed on this option");
    
        uint totalBets = optionAmounts[1] + optionAmounts[2];
        require(totalBets > 0, "No bets placed on any option");

        uint odds;
        if (option == 1) {
            odds = (totalBets * 1e18) / (optionAmounts[1] * teamAProbability);
        } else if (option == 2) {
            odds = (totalBets * 1e18) / (optionAmounts[2] * teamBProbability);
        }
    
        return odds;
    }

    function withdrawFunds(uint amount) public onlyOwner onlyActive {
        require(amount <= bank, "Amount exceeds bank balance");
        payable(owner).transfer(amount);
        bank -= amount;
    }

    function getMyBalance() public view returns (uint) {
        return payable(msg.sender).balance;
    }

    function getTeamAName() public view returns (string memory) {
        return teamAName;
    }

    function getTeamBName() public view returns (string memory) {
        return teamBName;
    }

    function viewOdds(uint option) public view returns (uint) {
        require(option == 1 || option == 2, "Invalid option");
        return calculateOdd(option);
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
}