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
    const PaymentSubscription = await hre.ethers.getContractFactory(
        'PaymentSubscription'
    );

    const paymentSubscription = await PaymentSubscription.attach(
        '0x21FA2F956f8A6b7EDC2dBaEA33652bD895864083'
    );

    console.log('Transfering ownership to Defender Relayer');

    await paymentSubscription.transferOwnership(
        '0x16b9c90df3e2927c68c69009fdafed8b27fd6b2d'
    );

    console.log('Done ✨');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
