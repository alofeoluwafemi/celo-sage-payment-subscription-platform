module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy('PaymentSubscription', {
        from: deployer,
        args: ['0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'],
        log: true
    });
};

module.exports.tags = ['PaymentSubscription'];
