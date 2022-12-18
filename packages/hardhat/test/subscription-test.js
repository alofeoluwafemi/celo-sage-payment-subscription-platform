const { expect } = require('chai');
const { ethers } = require('hardhat');

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

// cUSD address 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
before(async function () {
    const SubscriptionPayment = await ethers.getContractFactory(
        'SubscriptionPayment'
    );
    const subscriptionPayment = await SubscriptionPayment.deploy();

    const MockUSD = await ethers.getContractFactory('MockUSD');
    const cUSD = await SubscriptionPayment.deploy();

    await subscriptionPayment.deployed();
    await cUSD.deployed();

    this.subscriptionPayment = subscriptionPayment;
    this.cUSD = cUSD;
});

describe('Subscription', function () {
    it('Should run', async function () {
        //
    });
});
