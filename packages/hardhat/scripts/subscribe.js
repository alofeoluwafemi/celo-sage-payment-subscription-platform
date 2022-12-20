// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    const MockUSD = await hre.ethers.getContractFactory('MockUSD');

    const cUSD = await MockUSD.attach(
        '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'
    );

    const bal = await cUSD.balanceOf(
        '0x1502BF3c4fb5b01294B59163eBa1565E6c9B2136'
    );

    await cUSD.approve(
        '0x9b343FFDd8a472ed6C28b5B6F5811cBcc82E531E',
        ethers.utils.parseEther('24')
    );

    const PaymentSubscription = await hre.ethers.getContractFactory(
        'PaymentSubscription'
    );

    const paymentSubscription = await PaymentSubscription.attach(
        '0x9b343FFDd8a472ed6C28b5B6F5811cBcc82E531E'
    );

    console.log('Subscribing to Basic plan for 12 months');

    await paymentSubscription.subscribe(0, 12);

    console.log('Balance:', Number(ethers.utils.formatEther(bal)).toFixed(2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
