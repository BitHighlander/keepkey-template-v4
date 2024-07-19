import { Interface } from '@ethersproject/abi'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { useMultipleContractSingleData, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import ERC20ABI from '../utilities/abis/erc20.json'
// import { Erc20Interface } from '../utilities//abis/types/Erc20'
import { isAddress } from '../utilities/addresses'
import { nativeOnChain } from '../utilities/constants/tokens'
import { useInterfaceMulticall } from '../../hooks/useContract'

/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
export function useNativeCurrencyBalances(uncheckedAddresses?: (string | undefined)[]): {
  [address: string]: CurrencyAmount<Currency> | undefined
} {
  const { chainId } = useWeb3React()
  console.log(' | useNativeCurrencyBalances | chainId: ', chainId)

  const multicallContract = useInterfaceMulticall()
  console.log(' | useNativeCurrencyBalances | uncheckedAddresses: ', uncheckedAddresses)
  const validAddressInputs: [string][] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .map(isAddress)
            .filter((a): a is string => a !== false)
            .sort()
            .map((addr) => [addr])
        : [],
    [uncheckedAddresses]
  )
  console.log(' | useNativeCurrencyBalances | validAddressInputs: ', validAddressInputs)

  const results = useSingleContractMultipleData(multicallContract, 'getEthBalance', validAddressInputs)
  console.log(' | useNativeCurrencyBalances | results: ', results)

  return useMemo(
    () =>
      validAddressInputs.reduce<{ [address: string]: CurrencyAmount<Currency> }>((memo, [address], i) => {
        const value = results?.[i]?.result?.[0]
        console.log(` | useNativeCurrencyBalances | address: ${address}, value: ${value}`)
        if (value && chainId) {
          memo[address] = CurrencyAmount.fromRawAmount(nativeOnChain(chainId), JSBI.BigInt(value.toString()))
          console.log(' | useNativeCurrencyBalances | memo: ', memo)
        }
        return memo
      }, {}),
    [validAddressInputs, chainId, results]
  )
}

const ERC20Interface = new Interface(ERC20ABI) as any
const tokenBalancesGasRequirement = { gasRequired: 185_000 }

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }, boolean] {
  const { chainId } = useWeb3React() // we cannot fetch balances cross-chain
  console.log(' | useTokenBalancesWithLoadingIndicator | chainId: ', chainId)

  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false && t?.chainId === chainId) ?? [],
    [chainId, tokens]
  )
  console.log(' | useTokenBalancesWithLoadingIndicator | validatedTokens: ', validatedTokens)

  const validatedTokenAddresses = useMemo(() => validatedTokens.map((vt) => vt.address), [validatedTokens])
  console.log(' | useTokenBalancesWithLoadingIndicator | validatedTokenAddresses: ', validatedTokenAddresses)

  const balances = useMultipleContractSingleData(
    validatedTokenAddresses,
    ERC20Interface,
    'balanceOf',
    useMemo(() => [address], [address]),
    tokenBalancesGasRequirement
  )
  console.log(' | useTokenBalancesWithLoadingIndicator | balances: ', balances)

  const anyLoading: boolean = useMemo(() => balances.some((callState) => callState.loading), [balances])
  console.log(' | useTokenBalancesWithLoadingIndicator | anyLoading: ', anyLoading)

  return useMemo(
    () => [
      address && validatedTokens.length > 0
        ? validatedTokens.reduce<{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }>((memo, token, i) => {
            const value = balances?.[i]?.result?.[0]
            console.log(` | useTokenBalancesWithLoadingIndicator | token: ${token.address}, value: ${value}`)
            const amount = value ? JSBI.BigInt(value.toString()) : undefined
            if (amount) {
              memo[token.address] = CurrencyAmount.fromRawAmount(token, amount)
              console.log(' | useTokenBalancesWithLoadingIndicator | memo: ', memo)
            }
            return memo
          }, {})
        : {},
      anyLoading,
    ],
    [address, validatedTokens, anyLoading, balances]
  )
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: CurrencyAmount<Token> | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): CurrencyAmount<Token> | undefined {
  console.log(' | useTokenBalance | account: ', account)
  console.log(' | useTokenBalance | token: ', token)
  const tokenBalances = useTokenBalances(
    account,
    useMemo(() => [token], [token])
  )
  console.log(' | useTokenBalance | tokenBalances: ', tokenBalances)
  if (!token) return undefined
  return tokenBalances[token.address]
}

/**
 * Returns balances for tokens on currently-connected chainId via RPC.
 * See useTokenBalancesQuery for multichain portfolio balances via GQL.
 */
export function useCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined)[]
): (CurrencyAmount<Currency> | undefined)[] {
  console.log(' | useCurrencyBalances | account: ', account)
  const tokens = useMemo(
    () => currencies?.filter((currency): currency is Token => currency?.isToken ?? false) ?? [],
    [currencies]
  )
  console.log(' | useCurrencyBalances | tokens: ', tokens)

  const { chainId } = useWeb3React()
  console.log(' | useCurrencyBalances | chainId: ', chainId)

  const tokenBalances = useTokenBalances(account, tokens)
  console.log(' | useCurrencyBalances | tokenBalances: ', tokenBalances)

  const containsETH: boolean = useMemo(() => currencies?.some((currency) => currency?.isNative) ?? false, [currencies])
  const ethBalance = useNativeCurrencyBalances(useMemo(() => (containsETH ? [account] : []), [containsETH, account]))
  console.log(' | useCurrencyBalances | ethBalance: ', ethBalance)

  return useMemo(
    () =>
      currencies?.map((currency) => {
        if (!account || !currency || currency.chainId !== chainId) return undefined
        if (currency.isToken) return tokenBalances[currency.address]
        if (currency.isNative) return ethBalance[account]
        return undefined
      }) ?? [],
    [account, chainId, currencies, ethBalance, tokenBalances]
  )
}

export default function useCurrencyBalance(
  account?: string,
  currency?: Currency
): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(
    account,
    useMemo(() => [currency], [currency])
  )[0]
}
