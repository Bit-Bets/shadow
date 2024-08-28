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
    bool public isActive; // Novo estado para indicar se o contrato está ativo
    uint public winningOption; // Nova variável para armazenar a opção vencedora

    event BetPlaced(address indexed bettor, uint amount, uint option);
    event Payout(address indexed bettor, uint amount);
    event Transfer(address indexed to, uint amount); // Novo evento para transferências
    event WinningOptionSet(uint option); // Novo evento para quando a opção vencedora é definida

    constructor(
        uint initialBank,
        uint _maxBetAmount,
        string memory _teamAName,
        string memory _teamBName

    ) {
        require(initialBank > 0, "Initial bank must be greater than zero");
        require(_maxBetAmount > 0, "Max bet amount must be greater than zero");
        require(bytes(_teamAName).length > 0 && bytes(_teamBName).length > 0, "Team names must be provided");

        owner = msg.sender;
        bank = initialBank;
        totalAmount = initialBank;
        maxBetAmount = _maxBetAmount;
        teamAName = _teamAName;
        teamBName = _teamBName;
        isActive = true; // Define o contrato como ativo inicialmente
    }

    modifier onlyActive() {
        require(isActive, "Contract is no longer active");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function placeBet(uint option, uint betAmount) public payable onlyActive {
        require(option == 1 || option == 2, "Invalid option");
        require(betAmount > 0 && betAmount <= maxBetAmount && betAmount <= bank, "Bet amount invalid or exceeds limits");

        optionAmounts[option] += betAmount;
        totalAmount += betAmount;
        // bank -= betAmount;

        Bet memory newBet = Bet({
            bettor: msg.sender,
            amount: betAmount,
            option: option
        });

        bets.push(newBet);

        emit BetPlaced(msg.sender, betAmount, option);
    }

    function calculateOdds(uint option) internal view returns (uint) {
        require(optionAmounts[option] > 0, "No bets placed on this option");

        uint totalBets = optionAmounts[1] + optionAmounts[2];
        require(totalBets > 0, "No bets placed on any option");

        // Calcular o máximo payout permitido
        uint maxPayout = bank / totalBets;

        uint odds;
        if (option == 1) {
            odds = (maxPayout * 100) / optionAmounts[1];
        } else if (option == 2) {
            odds = (maxPayout * 100) / optionAmounts[2];
        }

        return odds;
    }

    function transfer(address to, uint amount) internal onlyOwner onlyActive {
        require(amount <= bank, "Amount exceeds bank balance");
        payable(to).transfer(amount);
        bank -= amount;
        emit Transfer(to, amount);
    }

    function setWinningOption(uint option) public onlyOwner onlyActive {
        require(option == 1 || option == 2, "Invalid option");
        winningOption = option;
        emit WinningOptionSet(option);
    }

    function distributeWinnings() public onlyOwner onlyActive {
        require(totalAmount > 0, "No bets to distribute");
        require(winningOption == 1 || winningOption == 2, "Winning option not set");

        uint totalBetsOnWinningOption = optionAmounts[winningOption];
        uint totalWinnings = address(this).balance;

        for (uint i = 0; i < bets.length; i++) {
            if (bets[i].option == winningOption) {
                uint payout = (bets[i].amount * totalWinnings) / totalBetsOnWinningOption;
                require(payout <= address(this).balance, "Insufficient funds for payout");
                payable(bets[i].bettor).transfer(payout);
                emit Payout(bets[i].bettor, payout);
            }
        }

        // Desativa o contrato após a distribuição dos ganhos
        isActive = false;
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
        return calculateOdds(option);
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }
}