import { useEffect, useState } from 'react';
import { ExplorerLink, ParsedAccount, useWallet } from '@oyster/common';
import { executeInstruction } from '../../../../../actions/executeInstruction';
import {
  InstructionExecutionStatus,
  Proposal,
  ProposalInstruction,
  ProposalState,
} from '../../../../../models/accounts';
import { useRpcContext } from '../../../../../hooks/useRpcContext';
import React from 'react';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { Button, Popover, Tooltip } from 'antd';

export enum PlayState {
  Played,
  Unplayed,
  Playing,
  Error,
}

export function ExecuteInstructionButton({
  proposal,
  playing,
  setPlaying,
  proposalInstruction,
}: {
  proposal: ParsedAccount<Proposal>;
  proposalInstruction: ParsedAccount<ProposalInstruction>;
  playing: PlayState;
  setPlaying: React.Dispatch<React.SetStateAction<PlayState>>;
}) {
  const { connected } = useWallet();

  const rpcContext = useRpcContext();
  const { connection } = rpcContext;
  const [currentSlot, setCurrentSlot] = useState(0);
  const [executeTx, setExecuteTx] = useState('');

  let canExecuteAt = proposal.info.votingCompletedAt
    ? proposal.info.votingCompletedAt.toNumber() + 1
    : 0;

  const ineligibleToSee = currentSlot - canExecuteAt >= 0;

  useEffect(() => {
    if (ineligibleToSee) {
      const timer = setTimeout(() => {
        connection.getSlot().then(setCurrentSlot);
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [ineligibleToSee, connection, currentSlot]);

  useEffect(() => {
    if (
      proposalInstruction.info.executionStatus ===
        InstructionExecutionStatus.None ||
      playing === PlayState.Playing
    ) {
      return;
    }

    if (
      proposalInstruction.info.executionStatus ===
      InstructionExecutionStatus.Success
    ) {
      connection
        .getSignaturesForAddress(
          proposalInstruction.pubkey,
          {
            limit: 1,
          },
          'confirmed',
        )
        .then(info => {
          setExecuteTx(info[0]?.signature);
        });
    }

    if (
      proposalInstruction.info.executionStatus ===
      InstructionExecutionStatus.Error
    ) {
      // For errors we have to request two last transactions because in order for an instruction to be flagged as error
      // we have to execute FlagInstructionError which will be the most recent one
      // and the one that
      connection
        .getSignaturesForAddress(
          proposalInstruction.pubkey,
          {
            limit: 2,
          },
          'confirmed',
        )
        .then(info => {
          const errTx = info.filter(t => t.err)[0];
          setExecuteTx(errTx.signature);
        });
    }
  }, [
    connection,
    proposalInstruction.info.executionStatus,
    proposalInstruction.pubkey.toBase58(),
    playing,
  ]);

  const onExecuteInstruction = async () => {
    setPlaying(PlayState.Playing);
    try {
      await executeInstruction(rpcContext, proposal, proposalInstruction);
    } catch (e) {
      setPlaying(PlayState.Error);
      return;
    }
    setPlaying(PlayState.Played);
  };

  if (
    proposalInstruction.info.executionStatus ===
    InstructionExecutionStatus.Success
  ) {
    return (
      <Popover
        title="Instruction has been executed successfully"
        content={
          <div>
            {executeTx && (
              <ExplorerLink
                address={executeTx}
                type="transaction"
                short
              ></ExplorerLink>
            )}
          </div>
        }
      >
        <CheckCircleOutlined style={{ color: 'green' }} />{' '}
      </Popover>
    );
  }

  if (
    proposal.info.state !== ProposalState.Executing &&
    proposal.info.state !== ProposalState.ExecutingWithErrors &&
    proposal.info.state !== ProposalState.Succeeded
  )
    return null;
  if (ineligibleToSee) return null;

  if (
    playing === PlayState.Unplayed &&
    proposalInstruction.info.executionStatus !==
      InstructionExecutionStatus.Error
  ) {
    return (
      <Tooltip title="execute instruction">
        <Button onClick={onExecuteInstruction} disabled={!connected}>
          <PlayCircleOutlined style={{ color: 'green' }} key="play" />
        </Button>
      </Tooltip>
    );
  } else if (playing === PlayState.Playing)
    return <LoadingOutlined style={{ color: 'orange' }} key="loading" />;
  else if (
    playing === PlayState.Error ||
    proposalInstruction.info.executionStatus ===
      InstructionExecutionStatus.Error
  )
    return (
      <Popover
        title="retry to execute instruction"
        content={
          <div>
            {executeTx && (
              <ExplorerLink
                address={executeTx}
                type="transaction"
                short
              ></ExplorerLink>
            )}
          </div>
        }
      >
        <Button onClick={onExecuteInstruction} disabled={!connected}>
          <RedoOutlined style={{ color: 'red' }} key="play" />
        </Button>
      </Popover>
    );
  else return <CheckCircleOutlined style={{ color: 'green' }} key="played" />;
}
