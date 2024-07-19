import { useState, useMemo } from 'react'
import type { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import type { Web3ReactHooks } from '@web3-react/core'
import type { GnosisSafe } from '@web3-react/gnosis-safe'
import type { MetaMask } from '@web3-react/metamask'
import type { Network } from '@web3-react/network'
import type { WalletConnect } from '@web3-react/walletconnect'
import type { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2'
import JSBI from 'jsbi'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useSingleContractMultipleData } from '../hooks/multicall'

import { getName } from '../utils'
import { Accounts } from './Accounts'
import { Chain } from './Chain'
import { ConnectWithSelect } from './ConnectWithSelect'
import { Status } from './Status'
import { isAddress } from '../utilities/addresses'
import { nativeOnChain } from '../utilities/constants/tokens'
import { useInterfaceMulticall } from '../hooks/useContract'

interface Props {
    connector: MetaMask | WalletConnect | WalletConnectV2 | CoinbaseWallet | Network | GnosisSafe
    activeChainId: ReturnType<Web3ReactHooks['useChainId']>
    chainIds?: ReturnType<Web3ReactHooks['useChainId']>[]
    isActivating: ReturnType<Web3ReactHooks['useIsActivating']>
    isActive: ReturnType<Web3ReactHooks['useIsActive']>
    error: Error | undefined
    setError: (error: Error | undefined) => void
    ENSNames: ReturnType<Web3ReactHooks['useENSNames']>
    provider?: ReturnType<Web3ReactHooks['useProvider']>
    accounts?: string[]
}

export function Card({
                         connector,
                         activeChainId,
                         chainIds,
                         isActivating,
                         isActive,
                         error,
                         setError,
                         ENSNames,
                         accounts,
                         provider,
                     }: Props) {
    const [results, setResults] = useState<{ [key: string]: string }>({})
    const pairedAddress = accounts && accounts.length > 0 ? accounts[0] : ''

    // Function to get native currency balances
    const useNativeCurrencyBalances = (uncheckedAddresses?: (string | undefined)[]): {
        [address: string]: CurrencyAmount<Currency> | undefined
    } => {
        const multicallContract = useInterfaceMulticall()
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

        const results = useSingleContractMultipleData(multicallContract, 'getEthBalance', validAddressInputs)

        return useMemo(
            () =>
                validAddressInputs.reduce<{ [address: string]: CurrencyAmount<Currency> }>((memo, [address], i) => {
                    const value = results?.[i]?.result?.[0]
                    if (value && activeChainId) {
                        memo[address] = CurrencyAmount.fromRawAmount(nativeOnChain(activeChainId), JSBI.BigInt(value.toString()))
                    }
                    return memo
                }, {}),
            [validAddressInputs, activeChainId, results]
        )
    }

    const balances = useNativeCurrencyBalances([pairedAddress])

    const callEthMethod = async (method: string, params: any[] = []) => {
        if (!provider) return
        try {
            let result
            if (typeof provider.request === 'function') {
                result = await provider.request({
                    method,
                    params,
                })
            } else if (typeof provider.send === 'function') {
                result = await provider.send(method, params)
            } else {
                throw new Error('Unsupported provider')
            }
            // Handle BigInt serialization
            if (typeof result === 'bigint') {
                result = result.toString()
            }
            setResults(prevResults => ({ ...prevResults, [method]: JSON.stringify(result, null, 2) }))
        } catch (error) {
            console.error(error)
            setResults(prevResults => ({ ...prevResults, [method]: `Error: ${error.message}` }))
        }
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '20rem',
                padding: '1rem',
                margin: '1rem',
                overflow: 'auto',
                border: '1px solid',
                borderRadius: '1rem',
            }}
        >
            <b>{getName(connector)}</b>
            <div style={{ marginBottom: '1rem' }}>
                <Status isActivating={isActivating} isActive={isActive} error={error} />
            </div>
            <Chain chainId={activeChainId} />
            <div style={{ marginBottom: '1rem' }}>
                <Accounts accounts={accounts} provider={provider} ENSNames={ENSNames} />
            </div>
            <ConnectWithSelect
                connector={connector}
                activeChainId={activeChainId}
                chainIds={chainIds}
                isActivating={isActivating}
                isActive={isActive}
                error={error}
                setError={setError}
            />

            {/* Display ETH balances */}
            <div style={{ marginBottom: '1rem' }}>
                <h3>ETH Balances</h3>
                {pairedAddress ? (
                    <div>
                        {pairedAddress}: {balances[pairedAddress]?.toSignificant(6) || 'Loading...'}
                    </div>
                ) : (
                    <div>No address connected</div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                    <p>eth_chainId</p>
                    <button onClick={() => callEthMethod('eth_chainId')}>Get eth_chainId</button>
                    {results['eth_chainId'] && <pre>{results['eth_chainId']}</pre>}
                </div>
                <div>
                    <p>net_version</p>
                    <button onClick={() => callEthMethod('net_version')}>Get net_version</button>
                    {results['net_version'] && <pre>{results['net_version']}</pre>}
                </div>
                <div>
                    <p>eth_accounts</p>
                    <button onClick={() => callEthMethod('eth_accounts')}>Get eth_accounts</button>
                    {results['eth_accounts'] && <pre>{results['eth_accounts']}</pre>}
                </div>
                <div>
                    <p>eth_getBlockByNumber</p>
                    <button onClick={() => callEthMethod('eth_getBlockByNumber', ['latest', true])}>Get eth_getBlockByNumber</button>
                    {results['eth_getBlockByNumber'] && <pre>{results['eth_getBlockByNumber']}</pre>}
                </div>
                <div>
                    <p>eth_blockNumber</p>
                    <button onClick={() => callEthMethod('eth_blockNumber')}>Get eth_blockNumber</button>
                    {results['eth_blockNumber'] && <pre>{results['eth_blockNumber']}</pre>}
                </div>
                <div>
                    <p>eth_getBalance</p>
                    <button onClick={() => callEthMethod('eth_getBalance', [pairedAddress, 'latest'])}>Get eth_getBalance</button>
                    {results['eth_getBalance'] && <pre>{results['eth_getBalance']}</pre>}
                </div>
                <div>
                    <p>eth_getTransactionReceipt</p>
                    <button onClick={() => callEthMethod('eth_getTransactionReceipt', ['0xYourTransactionHash'])}>Get eth_getTransactionReceipt</button>
                    {results['eth_getTransactionReceipt'] && <pre>{results['eth_getTransactionReceipt']}</pre>}
                </div>
                <div>
                    <p>eth_getTransactionByHash</p>
                    <button onClick={() => callEthMethod('eth_getTransactionByHash', ['0xYourTransactionHash'])}>Get eth_getTransactionByHash</button>
                    {results['eth_getTransactionByHash'] && <pre>{results['eth_getTransactionByHash']}</pre>}
                </div>
            </div>
        </div>
    )
}
