//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract PaymentSubscription is Pausable, Ownable {
    //Available plans
    enum Plan {
        Basic,
        Premium,
        Enterprise
    }

    //Subscription details
    struct Subscription {
        Plan plan;
        uint256 startDate;
        uint256 nextCharge;
        uint256 endDate;
    }

    //Plan details
    struct PlanDetail {
        Plan plan;
        uint256 price;
        uint256 duration;
    }

    //All plans
    mapping(Plan => PlanDetail) public plans;

    //All subscriptions
    mapping(address => Subscription) public subscriptions;

    //Active subscriptions
    mapping(address => bool) public activeSubscriptions;

    //Evenst for plan creation
    event PlanCreated(Plan plan, uint256 price, uint256 duration);

    //Events to notify subscription status
    event SubscriptionCreated(address indexed subscriber, Plan plan);
    event SubscriptionCanceled(address indexed subscriber);
    event SubscriptionCharged(
        address indexed subscriber,
        Plan plan,
        uint256 nextCharge
    );

    //Token to be used for subscription
    address public subscriptionToken;

    constructor(address _subscriptionToken) {
        require(_subscriptionToken != address(0), "Invalid token address");
        plans[Plan.Basic] = PlanDetail(Plan.Basic, 2e18, 30 * 1 days);
        plans[Plan.Premium] = PlanDetail(Plan.Premium, 5e18, 30 * 1 days);
        plans[Plan.Enterprise] = PlanDetail(
            Plan.Enterprise,
            12e18,
            30 * 1 days
        );

        emit PlanCreated(Plan.Basic, 2e18, 30 * 1 days);
        emit PlanCreated(Plan.Premium, 5e18, 30 * 1 days);
        emit PlanCreated(Plan.Enterprise, 12e18, 30 * 1 days);

        subscriptionToken = _subscriptionToken; //cUSD
    }

    function subscribe(Plan _plan, uint8 duration) public whenNotPaused {
        require(plans[_plan].price > 1, "Invalid plan");
        require(activeSubscriptions[msg.sender] == false, "Already subscribed");
        require(duration <= 12, "Max duration is 12 months");

        uint256 requiredAllowance = (plans[_plan].price * duration);

        require(
            IERC20(subscriptionToken).allowance(msg.sender, address(this)) >=
                requiredAllowance,
            "Incorrect allowance"
        );
        require(
            IERC20(subscriptionToken).balanceOf(msg.sender) >=
                plans[_plan].price,
            "Insufficient balance"
        );

        subscriptions[msg.sender] = Subscription({
            plan: _plan,
            startDate: block.timestamp,
            nextCharge: block.timestamp + plans[_plan].duration,
            endDate: block.timestamp + (plans[_plan].duration * duration)
        });

        //Charge for first month
        _charge(msg.sender);

        activeSubscriptions[msg.sender] = true;

        emit SubscriptionCreated(msg.sender, _plan);
    }

    function unsubscribe() public whenNotPaused {
        require(activeSubscriptions[msg.sender] == true, "Not subscribed");
        _cancel(msg.sender);
    }

    function charge(address subscriber) public onlyOwner whenNotPaused {
        require(activeSubscriptions[subscriber] == true, "Not subscribed");
        require(
            subscriptions[subscriber].nextCharge <= block.timestamp,
            "Not time to charge yet"
        );
        require(
            IERC20(subscriptionToken).allowance(subscriber, address(this)) >=
                plans[subscriptions[subscriber].plan].price,
            "Incorrect allowance"
        );

        _charge(subscriber);
    }

    function _charge(address subscriber) internal {
        require(
            IERC20(subscriptionToken).transferFrom(
                subscriber,
                address(this),
                plans[subscriptions[subscriber].plan].price
            ),
            "Transfer failed"
        );

        subscriptions[subscriber].nextCharge =
            block.timestamp +
            plans[subscriptions[subscriber].plan].duration;

        //If its end of subscription, cancel it
        if (
            subscriptions[subscriber].nextCharge >
            subscriptions[subscriber].endDate
        ) {
            _cancel(subscriber);
        }

        emit SubscriptionCharged(
            subscriber,
            subscriptions[subscriber].plan,
            subscriptions[subscriber].nextCharge
        );
    }

    function _cancel(address subscriber) internal {
        activeSubscriptions[subscriber] = false;
        delete subscriptions[subscriber];

        emit SubscriptionCanceled(subscriber);
    }

    function withdrawSubscriptionToken(
        address to,
        uint256 amount
    ) public onlyOwner {
        IERC20(subscriptionToken).transfer(to, amount);
    }
}
