//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
        uint256 price;
        uint256 duration;
    }

    //All plans
    mapping(Plan => PlanDetail) public plans;

    //All subscriptions
    mapping(address => Subscription) public subscriptions;

    //Active subscriptions
    mapping(address => bool) public activeSubscriptions;

    //Events to notify subscription status
    event SubscriptionCreated(address indexed subscriber, Plan plan);
    event SubscriptionCanceled(address indexed subscriber);
    event SubscriptionCharged(address indexed subscriber, Plan plan);

    //Token to be used for subscription
    address public subscriptionToken;

    constructor(address _subscriptionToken) {
        plans[Plan.Basic] = PlanDetail(2e18, 30 * 1 days);
        plans[Plan.Premium] = PlanDetail(5e18, 30 * 1 days);
        plans[Plan.Enterprise] = PlanDetail(12e18, 30 * 1 days);

        subscriptionToken = _subscriptionToken; //cUSD
    }

    function subscribe(Plan _plan, uint8 duration) public whenNotPaused {
        require(plans[_plan].price > 0, "Invalid plan");
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

        _charge(msg.sender);
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

        subscriptions[msg.sender].nextCharge =
            block.timestamp +
            plans[subscriptions[msg.sender].plan].duration;

        //If its end of subscription, cancel it
        if (
            subscriptions[msg.sender].nextCharge >
            subscriptions[msg.sender].endDate
        ) {
            _cancel(msg.sender);
        }

        emit SubscriptionCharged(msg.sender, subscriptions[msg.sender].plan);
    }

    function _cancel(address subscriber) internal {
        activeSubscriptions[subscriber] = false;
        delete subscriptions[subscriber];

        emit SubscriptionCanceled(msg.sender);
    }

    function withdrawSubscriptionToken(
        address to,
        uint256 amount
    ) public onlyOwner {
        IERC20(subscriptionToken).transfer(to, amount);
    }
}
