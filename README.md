# Betting Project

This is a decentralized betting platform deployed on the Polygon network.

## Prerequisites

- Node.js
- npm
- Truffle
- Ganache CLI

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/betting-project.git
    cd betting-project
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start Ganache CLI:
    ```bash
    ganache-cli
    ```

4. Compile and migrate the contracts:
    ```bash
    truffle compile
    truffle migrate
    ```

5. Run the tests:
    ```bash
    truffle test
    ```

## Deployment

To deploy the contract to a live network, configure your `truffle-config.js` with the appropriate network settings and run:
```bash
truffle migrate --network <network_name>
