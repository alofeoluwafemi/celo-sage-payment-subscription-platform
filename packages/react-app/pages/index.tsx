import { useCelo } from "@celo/react-celo";
import PaymentCard from "../components/PaymentCard";

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(38)}`;
};

export default function Home() {
  const { address, network, connect, destroy } = useCelo();

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
            <PaymentCard planName={"Basic"} price={2} />
          </div>
          <div className="flex">
            <PaymentCard planName={"Premium"} price={5} />
          </div>
          <div className="flex">
            <PaymentCard planName={"Enterprise"} price={12} />
          </div>
        </div>
      </div>
    </div>
  );
}
