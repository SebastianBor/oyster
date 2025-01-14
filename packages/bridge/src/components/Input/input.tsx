import React, { useEffect, useState } from 'react';
import {
  ConnectButton,
  CurrentUserWalletBadge,
  NumericInput,
  useMint,
  useUserAccounts,
  useWallet,
} from '@oyster/common';
import './style.less';
import { ASSET_CHAIN } from '../../models/bridge/constants';
import { TokenSelectModal } from '../TokenSelectModal';
import { chainToName } from '../../utils/assets';
import { TokenChain } from '../TokenDisplay/tokenChain';
import { EthereumConnect } from '../EthereumConnect';

export function Input(props: {
  title: string;
  balance?: number;
  asset?: string;
  chain?: ASSET_CHAIN;
  setAsset: (asset: string) => void;
  amount?: number | null;
  onChain: (chain: ASSET_CHAIN) => void;
  onInputChange: (value: number | undefined) => void;
  className?: string;
}) {
  const { connected } = useWallet();
  const [lastAmount, setLastAmount] = useState<string>('');
  const { userAccounts } = useUserAccounts();
  const [balance, setBalance] = useState<number>(0);
  const mint = useMint(props.asset?.startsWith('0x') ? '' : props.asset);

  useEffect(() => {
    if (props.chain === ASSET_CHAIN.Solana) {
      const currentAccount = userAccounts?.find(
        a => a.info.mint.toBase58() === props.asset,
      );
      if (currentAccount && mint) {
        setBalance(
          currentAccount.info.amount.toNumber() / Math.pow(10, mint.decimals),
        );
      } else {
        setBalance(0);
      }
    }
  }, [props.asset, props.chain, userAccounts, mint]);

  return (
    <div className={`dashed-input-container ${props.className}`}>
      <div className="input-header">{props.title}</div>
      <div className="input-chain">
        <TokenChain chain={props.chain} className={'input-icon'} />
        {chainToName(props.chain)}
        {props.chain !== ASSET_CHAIN.Solana ? (
          typeof props.balance === 'number' && (
            <div
              className="balance"
              onClick={() =>
                props.onInputChange && props.onInputChange(props.balance)
              }
            >
              {props.balance.toFixed(10)}
            </div>
          )
        ) : (
          <div
            className="balance"
            onClick={() => props.onInputChange && props.onInputChange(balance)}
          >
            {balance.toFixed(10)}
          </div>
        )}
      </div>
      <div className="input-container">
        <NumericInput
          className={'input'}
          value={
            parseFloat(lastAmount || '0.00') === props.amount
              ? lastAmount
              : props.amount?.toFixed(6)?.toString()
          }
          onChange={(val: string) => {
            if (props.onInputChange && parseFloat(val) !== props.amount) {
              if (!val || !parseFloat(val)) props.onInputChange(undefined);
              else props.onInputChange(parseFloat(val));
            }
            setLastAmount(val);
          }}
          style={{
            boxShadow: 'none',
            borderColor: 'transparent',
            outline: 'transparent',
          }}
          placeholder="0.00"
        />
        <div className="input-select">
          <TokenSelectModal
            onSelectToken={token => props.setAsset(token)}
            onChain={(chain: ASSET_CHAIN) => props.onChain(chain)}
            asset={props.asset}
            chain={props.chain}
            showIconChain={false}
          />
        </div>
      </div>
      {props.chain === ASSET_CHAIN.Ethereum ? (
        <EthereumConnect />
      ) : connected ? (
        <CurrentUserWalletBadge showDisconnect={true} />
      ) : (
        <ConnectButton type="text" size="large" allowWalletChange={true} />
      )}
    </div>
  );
}
