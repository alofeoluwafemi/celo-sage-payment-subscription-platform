import "../styles/globals.css";
import '@celo/react-celo/lib/styles.css';
import type { AppProps } from "next/app";
import { Alfajores, CeloProvider } from "@celo/react-celo";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CeloProvider
      dapp={{
        name: "Celo Sage | Payment Subscription",
        description: "#",
        url: "#",
        icon: "#"
      }}
      network={Alfajores}
    >
      <Component {...pageProps} />
    </CeloProvider>
  );
}
