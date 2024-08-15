// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Betting {
    struct Bet {
        address bettor;
        uint amount;
        uint option;
    }

    address public owner;
    mapping(uint => uint) public optionAmounts;
    Bet[] public bets;
    uint public totalAmount;
    uint public bank;
    uint public maxBetAmount;

    event BetPlaced(address indexed bettor, uint amount, uint option);
    event Payout(address indexed bettor, uint amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor(uint initialBank, uint _maxBetAmount) {
        owner = msg.sender;
        bank = initialBank;
        maxBetAmount = _maxBetAmount;
    }

    function placeBet(uint option) public payable {
        require(msg.value > 0 && msg.value <= maxBetAmount && msg.value <= bank, "Bet amount invalid or exceeds limits");

        Bet memory newBet = Bet({
            bettor: msg.sender,
            amount: msg.value,
            option: option
        });

        bets.push(newBet);
        optionAmounts[option] += msg.value;
        totalAmount += msg.value;
        bank -= msg.value;

        emit BetPlaced(msg.sender, msg.value, option);
    }

    function calculateOdd(uint option) public view returns (uint) {
        require(optionAmounts[option] > 0, "No bets placed on this option");
        return (totalAmount + bank) / optionAmounts[option]; // mudei essa budega
    }


    function distributeWinnings(uint winningOption) public onlyOwner {
        uint winningAmount = optionAmounts[winningOption];
        require(winningAmount > 0, "No bets placed on this option");

        uint odd = calculateOdd(winningOption);

        for (uint i = 0; i < bets.length; i++) {
            if (bets[i].option == winningOption) {
                uint payout = bets[i].amount * odd / 1e18;
                payable(bets[i].bettor).transfer(payout);
                emit Payout(bets[i].bettor, payout);
            }
        }

        totalAmount = 0;
        for (uint i = 0; i < bets.length; i++) {
            optionAmounts[bets[i].option] = 0;
        }
        delete bets; // Correctly resetting the array
        bank = address(this).balance;
    }


    function getBetDetails(uint index) public view returns (address, uint, uint) {
        require(index < bets.length, "Invalid bet index");
        Bet memory bet = bets[index];
        return (bet.bettor, bet.amount, bet.option);
    }

    function addFunds() public payable onlyOwner {
        bank += msg.value;
    }

    function withdrawFunds(uint amount) public onlyOwner {
        require(amount <= bank, "Amount exceeds bank balance");
        payable(owner).transfer(amount);
        bank -= amount;
    }
}
