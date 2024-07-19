/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Provider } from "@ethersproject/providers";
import { Contract, Signer, utils } from "ethers";
import type {
  Permit2Payments,
  Permit2PaymentsInterface,
} from "../Permit2Payments";

const _abi = [
  {
    inputs: [],
    name: "FromAddressIsNotOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientETH",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientToken",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidBips",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSpender",
    type: "error",
  },
];

export class Permit2Payments__factory {
  static readonly abi = _abi;
  static createInterface(): Permit2PaymentsInterface {
    return new utils.Interface(_abi) as Permit2PaymentsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Permit2Payments {
    return new Contract(address, _abi, signerOrProvider) as Permit2Payments;
  }
}
