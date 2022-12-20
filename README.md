## Description

In this tutorial, we will show you how to create a subscription platform using the Celo composer react-app and the hardhat package. The platform will offer three subscription plans that users can choose from, and payment will be charged monthly in cUSD. We will also use the OpenZeppelin Defender autotask to handle the monthly subscription charges and an email service to notify users of the charge status. By the end of this tutorial, you will have a working subscription platform and the knowledge to customize and build upon it for your own use case.

## Setup

Install dependecies

```bash
//In root folder
yarn
```

Create `.env` file in `packages/hardhat` folder.

Paste the default inside

```env
PRIVATE_KEY=0xba28d5cea192f121db5f1dd7f501532170bb7bb984c4d3747df3e251e529f77d
ACCOUNT_ADDRESS=0x81cb394E24e5AeA53C3BD6f3d48b43e9A3817CC6
```

Generate your own private key and address.

```
npx hardhat create-account
```

Fund your address with test tokens from Celo public faucet https://celo.org/developers/faucet.

## Run Test

```bash
npx hardhat test test/subscription-test.js --network hardhat
```

## Deploy

Deploy contract on Alfajores

```bash
cd packages/hardhat

yarn run deloy

cd packages/react-app

yarn run dev
```

## Transfer Ownership to Defender Relayer

Edit the `scripts/transferOwnership.js` file and change the addresses for the contract and relayer respectively

```bash
npx hardhat run scripts/transferOwnership.js
```

## Subscribe to a plan

Run the script to give allowance to *24 cUSD* and subscribe to basic plan for 12 months.

```bash
npx hardhat run scripts/suscribe.js
```

Most preferabbly use Defender Admin to interact with the cUSD and PaymentSubscription contracts to perform this actions 

## Further reasouces

- https://celo-composer-community-docs.vercel.app/
