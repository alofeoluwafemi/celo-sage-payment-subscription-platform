const { expect, assert } = require('chai');
const { ethers } = require('hardhat');
const helpers = require('@nomicfoundation/hardhat-network-helpers');

/**
 * TestCases
 * - Do we have 3 plans
 * - Is the first plan correct
 * - Is the second plan correct
 * - Is the third plan correct
 * - Can user subscribe to the right plan
 * - Can user subscribe to the wrong plan
 * - Can user subscribe to the same plan twice
 * - Can user subscribe to a plan without enough allowance
 * - Can user subscribe to a plan without enough balance for the first month
 * - Can user be charged for 11 more months on a 12 months plan
 * - After 12 months charges, is user subscription cancelled
 */

const oneMonth = 60 * 60 * 24 * 30;

// cUSD address 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
before(async function () {
    const [deployer, accountA, accountB, accountC] = await ethers.getSigners();
    const MockUSD = await ethers.getContractFactory('MockUSD');
    const cUSD = await MockUSD.deploy();

    await cUSD.deployed();

    const PaymentSubscription = await ethers.getContractFactory(
        'PaymentSubscription'
    );
    const paymentSubscription = await PaymentSubscription.deploy(cUSD.address);

    await paymentSubscription.deployed();

    this.paymentSubscription = paymentSubscription;
    this.cUSD = cUSD;

    this.deployer = deployer;
    this.accountA = accountA;
    this.accountB = accountB;
    this.accountC = accountC;

    await this.cUSD.mint(this.deployer.address, ethers.utils.parseEther('100'));
});

describe('Subscription', function () {
    it('Should have Basic plan existing', async function () {
        const basic = await this.paymentSubscription.plans(0);

        expect(basic.plan).to.equal(ethers.BigNumber.from(0));
        expect(basic.price).to.equal(ethers.utils.parseEther('2'));
        expect(basic.duration).to.equal(ethers.BigNumber.from(oneMonth));
    });

    it('Should have Premium plan existing', async function () {
        const premium = await this.paymentSubscription.plans(1);

        expect(premium.plan).to.equal(ethers.BigNumber.from(1));
        expect(premium.price).to.equal(ethers.utils.parseEther('5'));
        expect(premium.duration).to.equal(ethers.BigNumber.from(oneMonth));
    });

    it('Should have Enterprise plan existing', async function () {
        const enterprise = await this.paymentSubscription.plans(2);

        expect(enterprise.plan).to.equal(ethers.BigNumber.from(2));
        expect(enterprise.price).to.equal(ethers.utils.parseEther('12'));
        expect(enterprise.duration).to.equal(ethers.BigNumber.from(oneMonth));
    });

    it('Should allow user to subscribe to Basic plan for 12 months', async function () {
        const basic = await this.paymentSubscription.plans(0);

        await this.cUSD.approve(
            this.paymentSubscription.address,
            basic.price.mul(ethers.BigNumber.from(12))
        );

        await this.paymentSubscription.subscribe(basic.plan, 12);

        const subscription = await this.paymentSubscription.subscriptions(
            this.deployer.address
        );

        const currentTime = (await ethers.provider.getBlock('latest'))
            .timestamp;

        expect(subscription.plan).to.equal(basic.plan);
        expect(subscription.startDate).to.equal(
            ethers.BigNumber.from(currentTime)
        );
        expect(subscription.nextCharge).to.equal(
            ethers.BigNumber.from(currentTime + oneMonth)
        );
        expect(subscription.endDate).to.equal(
            ethers.BigNumber.from(currentTime + oneMonth * 12)
        );
    });

    it('Should not allow user to subscribe to the wrong plan', async function () {
        await this.cUSD.approve(
            this.paymentSubscription.address,
            ethers.BigNumber.from(120)
        );

        await expect(
            this.paymentSubscription.subscribe(4, 12)
        ).to.be.rejectedWith(Error);
    });

    it('Should not allow user to subscribe to the same plan twice', async function () {
        const basic = await this.paymentSubscription.plans(0);

        await this.cUSD.approve(
            this.paymentSubscription.address,
            basic.price.mul(ethers.BigNumber.from(12))
        );

        await expect(
            this.paymentSubscription.subscribe(basic.plan, 12)
        ).to.be.revertedWith('Already subscribed');
    });

    it('Should not allow user to subscribe to plan without enough allowance', async function () {
        await this.cUSD.mint(
            this.accountA.address,
            ethers.utils.parseEther('100')
        );

        const premium = await this.paymentSubscription.plans(1);

        await this.cUSD
            .connect(this.accountA)
            .approve(
                this.paymentSubscription.address,
                premium.price.mul(ethers.BigNumber.from(2))
            );

        await expect(
            this.paymentSubscription
                .connect(this.accountA)
                .subscribe(premium.plan, 12)
        ).to.be.revertedWith('Incorrect allowance');
    });

    it('Should not allow user to subscribe to plan without enough first month payment', async function () {
        await this.cUSD.mint(
            this.accountB.address,
            ethers.utils.parseEther('2')
        );

        const premium = await this.paymentSubscription.plans(1);

        await this.cUSD
            .connect(this.accountB)
            .approve(
                this.paymentSubscription.address,
                premium.price.mul(ethers.BigNumber.from(12))
            );

        await expect(
            this.paymentSubscription
                .connect(this.accountB)
                .subscribe(premium.plan, 12)
        ).to.be.revertedWith('Insufficient balance');
    });

    it('Should confirm user can be charged for 12 months and then unsubscribed automatically', async function () {
        await this.cUSD.mint(
            this.accountC.address,
            ethers.utils.parseEther('24')
        );

        const basic = await this.paymentSubscription.plans(0);

        await this.cUSD
            .connect(this.accountC)
            .approve(
                this.paymentSubscription.address,
                basic.price.mul(ethers.BigNumber.from(12))
            );

        //First month charge of 2 cUSD happens here
        await this.paymentSubscription
            .connect(this.accountC)
            .subscribe(basic.plan, 12);

        //Charge 11 more months
        for (let monthsCharged = 2; monthsCharged <= 12; monthsCharged++) {
            const currentBal = await this.cUSD.balanceOf(this.accountC.address);

            const subscription = await this.paymentSubscription.subscriptions(
                this.accountC.address
            );

            // mine a new block with timestamp `newTimestamp`
            await helpers.time.increase(oneMonth);

            await this.paymentSubscription
                .connect(this.deployer)
                .charge(this.accountC.address);

            // Added for visual debug purposes
            console.table({
                monthsCharged: monthsCharged,
                currentBalance: ethers.utils.formatEther(currentBal),
                nextCharge: subscription.nextCharge.toString()
            });
        }

        //Confirm if user paid for 12 months by checking balance

        expect(await this.cUSD.balanceOf(this.accountC.address)).to.equal(0);

        const subscription = await this.paymentSubscription.subscriptions(
            this.accountC.address
        );

        //Confirm if user is unsubscribed by checking subscription details
        expect(subscription.nextCharge).to.equal(0);
    });
});
