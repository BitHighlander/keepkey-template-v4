/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Provider } from "@ethersproject/providers";
import { Contract, Signer, utils } from "ethers";
import type { Permit2, Permit2Interface } from "../Permit2";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint160",
        name: "amount",
        type: "uint160",
      },
      {
        internalType: "uint48",
        name: "expiration",
        type: "uint48",
      },
      {
        internalType: "uint48",
        name: "nonce",
        type: "uint48",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "wordPos",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "mask",
        type: "uint256",
      },
    ],
    name: "invalidateUnorderedNonces",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class Permit2__factory {
  static readonly abi = _abi;
  static createInterface(): Permit2Interface {
    return new utils.Interface(_abi) as Permit2Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Permit2 {
    return new Contract(address, _abi, signerOrProvider) as Permit2;
  }
}
