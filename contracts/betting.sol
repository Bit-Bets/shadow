// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Betting {
    struct Bet {
        address bettor;
        uint amount;
        uint option; // 1 para o time A, 2 para o time B
        uint odds;   // Odds da aposta no momento da colocação
    }

    address public owner;
    mapping(uint => uint) public optionAmounts; // Armazena valores apostados para as opções de times
    Bet[] public bets;
    uint public totalAmount;
    uint public maxBetAmount;
    string public teamAName;
    string public teamBName;
    bool public isActive; // Estado para indicar se o contrato está ativo
    uint public winningOption; // Variável para armazenar a opção vencedora
    uint public oddsA; // Odd atual para o time A
    uint public oddsB; // Odd atual para o time B

    event BetPlaced(address indexed bettor, uint amount, uint option, uint odds);
    event Payout(address indexed bettor, uint amount);
    event Transfer(address indexed to, uint amount); // Evento para transferências
    event WinningOptionSet(uint option); // Evento para quando a opção vencedora é definida

    constructor(
        uint _maxBetAmount,
        string memory _teamAName,
        string memory _teamBName
    ) payable {
        require(msg.value > 0, "Initial bank must be greater than zero");
        require(_maxBetAmount > 0, "Max bet amount must be greater than zero");
        require(bytes(_teamAName).length > 0 && bytes(_teamBName).length > 0, "Team names must be provided");

        owner = msg.sender;
        maxBetAmount = _maxBetAmount;
        teamAName = _teamAName;
        teamBName = _teamBName;
        isActive = true; // Define o contrato como ativo inicialmente

        // Define odds iniciais fixas
        oddsA = 12; // 1.2 multiplicado por 10 para evitar valores decimais
        oddsB = 16; // 1.6 multiplicado por 10 para evitar valores decimais
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

        

        uint currentOdds = (option == 1) ? oddsA : oddsB;

        optionAmounts[option] += betAmount;
        totalAmount += betAmount;

        Bet memory newBet = Bet({
            bettor: msg.sender,
            amount: betAmount,
            option: option,
            odds: currentOdds
        });

        bets.push(newBet);

        emit BetPlaced(msg.sender, betAmount, option, currentOdds);

        // Recalcula as odds antes de registrar a aposta
        if (option == 1) {
            oddsA = calculateOdds(1);
        } else if (option == 2) {
            oddsB = calculateOdds(2);
        }
    }

    function calculateOdds(uint option) internal view returns (uint) {
    uint totalBets = optionAmounts[1] + optionAmounts[2];
    if (totalBets == 0 || optionAmounts[option] == 0) {
        return (option == 1) ? 12 : 16; // Retorna odds iniciais se não houver apostas suficientes
    }

    // Calcula a nova odd baseada na porcentagem do total apostado no time oposto
    uint oppositeOption = (option == 1) ? 2 : 1;
    uint odds = (totalBets * 10) / optionAmounts[option];
    
    // Garante que a odd nunca caia abaixo de 1.1 (ou 11 na escala multiplicada por 10)
    if (odds < 11) {
        odds = 11;
    }
    
    return odds;
}


    function transfer(address to, uint amount) internal onlyOwner onlyActive {
        require(amount <= address(this).balance, "Amount exceeds contract balance");
        payable(to).transfer(amount);
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
    require(totalBetsOnWinningOption > 0, "No bets on winning option");

    uint totalWinnings = address(this).balance; // Usa o saldo real do contrato
    uint totalPayout = 0;

    // Primeiro, calcula o valor total a ser pago para todos os vencedores
    for (uint i = 0; i < bets.length; i++) {
        if (bets[i].option == winningOption) {
            uint payout = (bets[i].amount * bets[i].odds) / 10; // Divide por 10 para ajustar a escala da odd
            totalPayout += payout;
        }
    }

    require(totalPayout <= totalWinnings, "Insufficient funds for payout");

    // Faz o pagamento para cada vencedor
    for (uint i = 0; i < bets.length; i++) {
        if (bets[i].option == winningOption) {
            uint payout = (bets[i].amount * bets[i].odds) / 10; // Divide por 10 para ajustar a escala da odd
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
        return (option == 1) ? oddsA : oddsB;
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getInitialOdds(uint option) public view returns (uint) {
        if (option == 1) {
            return 12; // 1.2 como um inteiro (12)
        } else if (option == 2) {
            return 16; // 1.6 como um inteiro (16)
        } else {
            return 0; // Caso opção inválida
        }
    }
}
