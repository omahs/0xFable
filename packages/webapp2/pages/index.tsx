import { useWeb3Modal } from "@web3modal/react";
import { useAccount } from "wagmi";
import {useIsMounted} from "../hooks/useIsMounted";

const Home = () => {
  console.log("poggers")
  return <div>hello</div>
  // const { address } = useAccount();
  // const { open } = useWeb3Modal();
  // const isMounted = useIsMounted();
  //
  // return (
  //   <>
  //     <main className="flex min-h-screen flex-col items-center justify-center">
  //       <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
  //         <h1 className="font-serif text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
  //           <span className="font-mono font-light text-red-400">0x</span>FABLE
  //         </h1>
  //
  //         {/*{address && (*/}
  //         {/*  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-8">*/}
  //         {/*    <CreateGameModal />*/}
  //         {/*    <JoinGameModal />*/}
  //         {/*    <MintGameModal />*/}
  //         {/*  </div>*/}
  //         {/*)}*/}
  //
  //         {!address && (
  //           <div className="">
  //             <button
  //               className="btn-lg btn border-2 border-yellow-500 normal-case hover:scale-105 hover:border-yellow-400"
  //               onClick={async () => {
  //                 await open();
  //               }}
  //             >
  //               Connect Wallet
  //             </button>
  //           </div>
  //         )}
  //
  //         {address && (
  //           <div className="">
  //             <button
  //               className="btn-glass btn normal-case"
  //               onClick={async () => await open()}
  //             >
  //               Hello Adventurer, {address}
  //             </button>
  //           </div>
  //         )}
  //       </div>
  //     </main>
  //   </>
  // );
};

export default Home;
