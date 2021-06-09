import { PublicKey } from '@solana/web3.js';

import { GovernanceConfig, InstructionData } from './accounts';

export enum GovernanceInstruction {
  CreateRealm = 0, // done
  DepositGoverningTokens = 1, // done
  WithdrawGoverningTokens = 2, // done
  SetGovernanceDelegate = 3, // --
  CreateAccountGovernance = 4, // done
  CreateProgramGovernance = 5, // done
  CreateProposal = 6, // done
  AddSignatory = 7, // done
  RemoveSignatory = 8, // done

  InsertInstruction = 9, // done
  RemoveInstruction = 10, // done
  CancelProposal = 11, // done
  SignOffProposal = 12, // done
  CastVote = 13, // done
  FinalizeVote = 14, // *
  RelinquishVote = 15, // done
  ExecuteInstruction = 16, // done
}

export class CreateRealmArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CreateRealm;
  name: string;

  constructor(args: { name: string }) {
    this.name = args.name;
  }
}

export class DepositGoverningTokensArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.DepositGoverningTokens;
}

export class WithdrawGoverningTokensArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.WithdrawGoverningTokens;
}

export class CreateAccountGovernanceArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.CreateAccountGovernance;
  config: GovernanceConfig;

  constructor(args: { config: GovernanceConfig }) {
    this.config = args.config;
  }
}

export class CreateProgramGovernanceArgs {
  instruction: GovernanceInstruction =
    GovernanceInstruction.CreateProgramGovernance;
  config: GovernanceConfig;
  transferUpgradeAuthority: boolean;

  constructor(args: {
    config: GovernanceConfig;
    transferUpgradeAuthority: boolean;
  }) {
    this.config = args.config;
    this.transferUpgradeAuthority = !!args.transferUpgradeAuthority;
  }
}

export class CreateProposalArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CreateProposal;
  name: string;
  descriptionLink: string;
  governingTokenMint: PublicKey;

  constructor(args: {
    name: string;
    descriptionLink: string;
    governingTokenMint: PublicKey;
  }) {
    this.name = args.name;
    this.descriptionLink = args.descriptionLink;
    this.governingTokenMint = args.governingTokenMint;
  }
}

export class AddSignatoryArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.AddSignatory;
  signatory: PublicKey;

  constructor(args: { signatory: PublicKey }) {
    this.signatory = args.signatory;
  }
}

export class SignOffProposalArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.SignOffProposal;
}

export class CancelProposalArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CancelProposal;
}

export enum Vote {
  Yes,
  No,
}

export class CastVoteArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.CastVote;
  vote: Vote;

  constructor(args: { vote: Vote }) {
    this.vote = args.vote;
  }
}

export class RelinquishVoteArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.RelinquishVote;
}

export class InsertInstructionArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.InsertInstruction;
  index: number;
  holdUpTime: number;
  instructionData: InstructionData;

  constructor(args: {
    index: number;
    holdUpTime: number;
    instructionData: InstructionData;
  }) {
    this.index = args.index;
    this.holdUpTime = args.holdUpTime;
    this.instructionData = args.instructionData;
  }
}

export class RemoveInstructionArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.RemoveInstruction;
}

export class ExecuteInstructionArgs {
  instruction: GovernanceInstruction = GovernanceInstruction.ExecuteInstruction;
}
