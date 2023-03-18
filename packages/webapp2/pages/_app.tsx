// import type { AppType } from "next/app";
// import {
//   EthereumClient,
//   modalConnectors,
//   walletConnectProvider,
// } from "@web3modal/ethereum";
// //// For Web3Modeal 2.2.1 — doesn't work with wagmi/ethers right now
// // import {
// //   EthereumClient,
// //   w3mConnectors,
// //   w3mProvider
// // } from "@web3modal/ethereum";
// import { Web3Modal } from "@web3modal/react";
// import { configureChains, createClient, WagmiConfig } from "wagmi";
// import { localhost } from "wagmi/chains";
//
// // import "../styles/globals.css";
//
// // From the WalletConnect cloud
// const projectId='8934622f70e11b51de893ea309871a4c'
//
// const chains = [localhost]
//
// //// For Web3Modal 2.2.1 — doesn't work with wagmi/ethers right now
// // const { provider } = configureChains(chains, [w3mProvider({ projectId })])
// //
// // const wagmiClient = createClient({
// //   autoConnect: true,
// //   connectors: w3mConnectors({ projectId, version: 2, chains }), // todo v2?
// //   provider,
// // })
//
// const { provider } = configureChains(chains, [walletConnectProvider({ projectId })]);
//
// const wagmiClient = createClient({
//   autoConnect: true,
//   connectors: modalConnectors({
//     projectId,
//     version: "1", // or "2"
//     appName: "0xFable",
//     chains,
//   }),
//   provider
// })
//
// const ethereumClient = new EthereumClient(wagmiClient, chains)
//
// const App: AppType = ({ Component, pageProps }) => {
//   return (
//     <>
//       <WagmiConfig client={wagmiClient}>
//         <Component {...pageProps} />
//       </WagmiConfig>
//
//       <Web3Modal
//         projectId={projectId}
//         ethereumClient={ethereumClient}
//       />
//     </>
//   );
// };
//
// export default App;

import type { AppType } from "next/app";
import {
  EthereumClient, modalConnectors,
  walletConnectProvider
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import Head from "next/head";
import { configureChains, createClient, WagmiConfig } from "../ngmi";
import { localhost } from "wagmi/chains";

// From the WalletConnect cloud
//const projectId='8934622f70e11b51de893ea309871a4c'
const projectId='650a5b278f3271e644d8d3527cd7bdf2'

const chains = [localhost]

const { provider } = configureChains(chains, [walletConnectProvider({ projectId })]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: modalConnectors({
    projectId,
    version: "2", // or "2"
    appName: "0xFable",
    chains,
  }),
  provider
})

console.log(wagmiClient)

const ethereumClient = new EthereumClient(wagmiClient, chains)

console.log(ethereumClient)

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>0xFable</title>
        {/*<link rel="icon" href="/favicon.ico" />*/}
      </Head>

      <WagmiConfig client={wagmiClient}>
        <Component {...pageProps} />
      </WagmiConfig>

      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
      />
    </>
  );
};

export default MyApp;