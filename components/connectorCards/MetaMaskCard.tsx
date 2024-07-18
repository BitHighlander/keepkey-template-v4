import { useEffect, useState } from 'react';
import { hooks, metaMask } from '../../connectors/metaMask';
import { ethers } from 'ethers';

const { useChainId, useAccounts, useIsActivating, useIsActive, useProvider, useENSNames } = hooks;

export default function MetaMaskCard() {
    const chainId = useChainId();
    const accounts = useAccounts();
    const isActivating = useIsActivating();
    const isActive = useIsActive();
    const provider = useProvider();
    const ENSNames = useENSNames(provider);

    const [error, setError] = useState<Error | undefined>(undefined);
    const [balance, setBalance] = useState<string | undefined>(undefined);
    const [connected, setConnected] = useState<boolean>(false);

    // Fetch account balance
    useEffect(() => {
        if (provider && accounts && accounts.length > 0) {
            provider.getBalance(accounts[0]).then((balance) => {
                setBalance(ethers.utils.formatEther(balance));
            }).catch((error) => {
                setError(error);
            });
        }
    }, [provider, accounts]);

    // Attempt to connect eagerly on mount
    useEffect(() => {
        void metaMask.connectEagerly().then(() => {
            setConnected(true);
        }).catch(() => {
            console.debug('Failed to connect eagerly to MetaMask');
        });
    }, []);

    // Function to switch network
    const switchNetwork = async (networkId: number) => {
        try {
            await provider.send('wallet_switchEthereumChain', [{ chainId: ethers.utils.hexValue(networkId) }]);
        } catch (switchError) {
            if (switchError.code === 4902) {
                // This error code indicates that the chain has not been added to MetaMask
                try {
                    await provider.send('wallet_addEthereumChain', [
                        {
                            chainId: ethers.utils.hexValue(networkId),
                            rpcUrl: 'https://...',
                            chainName: '...',
                            nativeCurrency: { name: '...', symbol: '...', decimals: 18 },
                            blockExplorerUrl: 'https://...',
                        },
                    ]);
                } catch (addError) {
                    setError(addError);
                }
            } else {
                setError(switchError);
            }
        }
    };

    // Function to disconnect MetaMask
    const disconnect = () => {
        setConnected(false);
        // Additional logic to reset states if necessary
    };

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
            <b>{metaMask?.name ?? 'MetaMask'}</b>
            <div style={{ marginBottom: '1rem' }}>
                <div>Status: {isActivating ? 'Connecting...' : isActive ? 'Connected' : 'Disconnected'}</div>
                {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
            </div>
            <div>Chain ID: {chainId}</div>
            <div style={{ marginBottom: '1rem' }}>
                <div>Accounts:</div>
                {accounts?.map((account, index) => (
                    <div key={index}>{ENSNames ? ENSNames[index] || account : account}</div>
                ))}
            </div>
            <div>Balance: {balance} ETH</div>
            {connected && accounts && accounts.length > 0 && (
                <div>
                    <button onClick={() => switchNetwork(1)}>Switch to Mainnet</button>
                    <button onClick={() => switchNetwork(3)}>Switch to Ropsten</button>
                    <button onClick={disconnect}>Disconnect</button>
                </div>
            )}
        </div>
    );
}
