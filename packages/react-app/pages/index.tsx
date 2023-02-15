import { useCelo } from "@celo/react-celo";
import PaymentCard from "../components/PaymentCard";
import {
  abi as psAbi,
  address as psAddress,
} from "@celo-sage-payment-subscription-platform/hardhat/deployments/alfajores/PaymentSubscription.json";
import { useEffect, useState } from "react";
import { parseEther } from "ethers/lib/utils";

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(38)}`;
};

const plans = {
  0: { name: "Basic", price: 2 },
  1: { name: "Premium", price: 5 },
  2: { name: "Enterprise", price: 12 },
};

export default function Home() {
  const subscriptionToken = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
  const [activePlan, setActivePlan] = useState(null);
  const { address, network, connect, destroy, kit } = useCelo();
  const paymentSubscriptionContract = new kit.connection.web3.eth.Contract(
    psAbi,
    psAddress
  );

  const cUSDContract = new kit.connection.web3.eth.Contract(
    [
      {
        inputs: [
          {
            internalType: "address",
            name: "spender",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "approve",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    subscriptionToken
  );

  const subscribeToPlan = async function (plan) {
    try {
      const approved = await cUSDContract.methods
        .approve(
          psAddress,
          parseEther((plans[plan].price * 12).toString()).toHexString()
        )
        .send({ from: address });

      if (approved) {
        const tx = await paymentSubscriptionContract.methods
          .subscribe(plan, 12)
          .send({
            from: address,
          });

        setActivePlan(plan);

        console.log(tx);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const getActivePlan = async () => {
      const plan = await paymentSubscriptionContract.methods
        .subscriptions(address)
        .call();

      if (plan.endDate !== "0") {
        setActivePlan(parseInt(plan.plan));
      }
    };

    getActivePlan();
  }, [address]);

  return (
    <div>
      <div className="w-full py-5 text-right border border-t-0 border-x-0 border-gray-100 px-4 mb-4">
        {address ? (
          <>
            <span className="text-white mr-4 disbaled bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:text-white  dark:focus:ring-purple-900">
              {network.name}
            </span>

            <span className="text-white mr-4 disbaled bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:text-white  dark:focus:ring-purple-900">
              {truncateAddress(address)}
            </span>

            <button
              onClick={() => destroy().catch((e) => console.log(e))}
              className="text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 font-medium rounded-md text-sm px-5 py-2.5 text-center dark:text-white  dark:focus:ring-purple-900"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => connect().catch((e) => console.log(e))}
              className="text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 font-medium rounded-md text-sm px-5 py-2.5 text-center dark:text-white  dark:focus:ring-purple-900"
            >
              Connect Wallet
            </button>
          </>
        )}
      </div>

      <div className="container mx-auto">
        <div className="max-w-screen-md mx-auto mb-8 text-center lg:mb-12">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Designed for business teams like yours
          </h2>
          <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-400">
            Here at Landwind we focus on markets where technology, innovation,
            and capital can unlock long-term value and drive economic growth.
          </p>
        </div>
        <div className="space-y-8 lg:grid lg:grid-cols-3 sm:gap-6 xl:gap-10 lg:space-y-0">
          <div className="flex">
            <PaymentCard
              planName={"Basic"}
              active={activePlan === 0}
              price={2}
              onClick={() => subscribeToPlan(0)}
            />
          </div>
          <div className="flex">
            <PaymentCard
              planName={"Premium"}
              price={5}
              active={activePlan === 1}
              onClick={() => subscribeToPlan(1)}
            />
          </div>
          <div className="flex">
            <PaymentCard
              planName={"Enterprise"}
              price={12}
              active={activePlan === 2}
              onClick={() => subscribeToPlan(2)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
