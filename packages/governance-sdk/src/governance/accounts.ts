import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import { Vote, VoteKind } from './instructions';
import { PROGRAM_VERSION_V1, PROGRAM_VERSION_V2 } from '../registry/constants';
import moment from 'moment';

/// Seed  prefix for Governance Program PDAs
export const GOVERNANCE_PROGRAM_SEED = 'governance';

export enum GovernanceAccountType {
  Uninitialized = 0,
  Realm = 1,
  TokenOwnerRecord = 2,
  AccountGovernance = 3,
  ProgramGovernance = 4,
  ProposalV1 = 5,
  SignatoryRecord = 6,
  VoteRecordV1 = 7,
  ProposalInstructionV1 = 8,
  MintGovernance = 9,
  TokenGovernance = 10,
  RealmConfig = 11,
  VoteRecordV2 = 12,
  ProposalInstructionV2 = 13,
  ProposalV2 = 14,
  ProgramMetadata = 14,
}

export interface GovernanceAccount {
  accountType: GovernanceAccountType;
}

export type GovernanceAccountClass =
  | typeof Realm
  | typeof TokenOwnerRecord
  | typeof Governance
  | typeof Proposal
  | typeof SignatoryRecord
  | typeof VoteRecord
  | typeof ProposalInstruction
  | typeof RealmConfigAccount
  | typeof ProgramMetadata;

export function getAccountTypes(accountClass: GovernanceAccountClass) {
  switch (accountClass) {
    case Realm:
      return [GovernanceAccountType.Realm];
    case TokenOwnerRecord:
      return [GovernanceAccountType.TokenOwnerRecord];
    case Proposal:
      return [
        GovernanceAccountType.ProposalV1,
        GovernanceAccountType.ProposalV2,
      ];
    case SignatoryRecord:
      return [GovernanceAccountType.SignatoryRecord];
    case VoteRecord:
      return [
        GovernanceAccountType.VoteRecordV1,
        GovernanceAccountType.VoteRecordV2,
      ];
    case ProposalInstruction:
      return [
        GovernanceAccountType.ProposalInstructionV1,
        GovernanceAccountType.ProposalInstructionV2,
      ];
    case RealmConfigAccount:
      return [GovernanceAccountType.RealmConfig];
    case Governance:
      return [
        GovernanceAccountType.AccountGovernance,
        GovernanceAccountType.ProgramGovernance,
        GovernanceAccountType.MintGovernance,
        GovernanceAccountType.TokenGovernance,
      ];
    case ProgramMetadata:
      return [GovernanceAccountType.ProgramMetadata];
    default:
      throw Error(`${accountClass} account is not supported`);
  }
}

export function getAccountProgramVersion(accountType: GovernanceAccountType) {
  switch (accountType) {
    case GovernanceAccountType.VoteRecordV2:
    case GovernanceAccountType.ProposalInstructionV2:
    case GovernanceAccountType.ProposalV2:
      return PROGRAM_VERSION_V2;
    default:
      return PROGRAM_VERSION_V1;
  }
}

export enum VoteThresholdPercentageType {
  YesVote = 0,
  Quorum = 1,
}

export class VoteThresholdPercentage {
  type = VoteThresholdPercentageType.YesVote;
  value: number;

  constructor(args: { value: number }) {
    this.value = args.value;
  }
}

export enum VoteWeightSource {
  Deposit,
  Snapshot,
}

export enum InstructionExecutionStatus {
  None,
  Success,
  Error,
}

export enum InstructionExecutionFlags {
  None,
  Ordered,
  UseTransaction,
}

export enum MintMaxVoteWeightSourceType {
  SupplyFraction = 0,
  Absolute = 1,
}

export class MintMaxVoteWeightSource {
  type = MintMaxVoteWeightSourceType.SupplyFraction;
  value: BN;

  constructor(args: { value: BN }) {
    this.value = args.value;
  }

  static SUPPLY_FRACTION_BASE = new BN(10000000000);
  static SUPPLY_FRACTION_DECIMALS = 10;

  static FULL_SUPPLY_FRACTION = new MintMaxVoteWeightSource({
    value: MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE,
  });

  isFullSupply() {
    return (
      this.type === MintMaxVoteWeightSourceType.SupplyFraction &&
      this.value.cmp(MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE) === 0
    );
  }
  getSupplyFraction() {
    if (this.type !== MintMaxVoteWeightSourceType.SupplyFraction) {
      throw new Error('Max vote weight is not fraction');
    }

    return this.value;
  }
  fmtSupplyFractionPercentage() {
    return new BigNumber(this.getSupplyFraction() as any)
      .shiftedBy(-MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS + 2)
      .toFormat();
  }
}

export enum VoteTypeKind {
  SingleChoice = 0,
  MultiChoice = 1,
}

export class VoteType {
  type: VoteTypeKind;
  choiceCount: number | undefined;

  constructor(args: { type: VoteTypeKind; choiceCount: number | undefined }) {
    this.type = args.type;
    this.choiceCount = args.choiceCount;
  }

  static SINGLE_CHOICE = new VoteType({
    type: VoteTypeKind.SingleChoice,
    choiceCount: undefined,
  });

  static MULTI_CHOICE = (choiceCount: number) =>
    new VoteType({
      type: VoteTypeKind.MultiChoice,
      choiceCount: choiceCount,
    });

  isSingleChoice() {
    return this.type === VoteTypeKind.SingleChoice;
  }
}

export class RealmConfigArgs {
  useCouncilMint: boolean;
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
  minCommunityTokensToCreateGovernance: BN;

  // Versions >= 2
  useCommunityVoterWeightAddin: boolean;

  constructor(args: {
    useCouncilMint: boolean;

    communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
    minCommunityTokensToCreateGovernance: BN;

    useCommunityVoterWeightAddin: boolean;
  }) {
    this.useCouncilMint = !!args.useCouncilMint;

    this.communityMintMaxVoteWeightSource =
      args.communityMintMaxVoteWeightSource;

    this.minCommunityTokensToCreateGovernance =
      args.minCommunityTokensToCreateGovernance;
    this.useCommunityVoterWeightAddin = args.useCommunityVoterWeightAddin;
  }
}

export class RealmConfig {
  councilMint: PublicKey | undefined;
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
  minCommunityTokensToCreateGovernance: BN;
  useCommunityVoterWeightAddin: boolean;
  reserved: Uint8Array;

  constructor(args: {
    councilMint: PublicKey | undefined;
    communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
    minCommunityTokensToCreateGovernance: BN;
    reserved: Uint8Array;
    useCommunityVoterWeightAddin: boolean;
  }) {
    this.councilMint = args.councilMint;
    this.communityMintMaxVoteWeightSource =
      args.communityMintMaxVoteWeightSource;
    this.minCommunityTokensToCreateGovernance =
      args.minCommunityTokensToCreateGovernance;
    this.useCommunityVoterWeightAddin = args.useCommunityVoterWeightAddin;
    this.reserved = args.reserved;
  }
}

export class Realm {
  accountType = GovernanceAccountType.Realm;

  communityMint: PublicKey;

  config: RealmConfig;

  reserved: Uint8Array;

  authority: PublicKey | undefined;

  name: string;

  constructor(args: {
    communityMint: PublicKey;
    reserved: Uint8Array;
    config: RealmConfig;
    authority: PublicKey | undefined;
    name: string;
  }) {
    this.communityMint = args.communityMint;
    this.config = args.config;
    this.reserved = args.reserved;

    this.authority = args.authority;
    this.name = args.name;
  }
}

export async function getTokenHoldingAddress(
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
) {
  const [tokenHoldingAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
    ],
    programId,
  );

  return tokenHoldingAddress;
}

export class RealmConfigAccount {
  accountType = GovernanceAccountType.RealmConfig;

  realm: PublicKey;
  communityVoterWeightAddin: PublicKey | undefined;

  constructor(args: {
    realm: PublicKey;
    communityVoterWeightAddin: PublicKey | undefined;
  }) {
    this.realm = args.realm;
    this.communityVoterWeightAddin = args.communityVoterWeightAddin;
  }
}

export async function getRealmConfigAddress(
  programId: PublicKey,
  realm: PublicKey,
) {
  const [realmConfigAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('realm-config'), realm.toBuffer()],
    programId,
  );

  return realmConfigAddress;
}

export class GovernanceConfig {
  voteThresholdPercentage: VoteThresholdPercentage;
  minCommunityTokensToCreateProposal: BN;
  minInstructionHoldUpTime: number;
  maxVotingTime: number;
  voteWeightSource: VoteWeightSource;
  proposalCoolOffTime: number;
  minCouncilTokensToCreateProposal: BN;

  constructor(args: {
    voteThresholdPercentage: VoteThresholdPercentage;
    minCommunityTokensToCreateProposal: BN;
    minInstructionHoldUpTime: number;
    maxVotingTime: number;
    voteWeightSource?: VoteWeightSource;
    proposalCoolOffTime?: number;
    minCouncilTokensToCreateProposal: BN;
  }) {
    this.voteThresholdPercentage = args.voteThresholdPercentage;
    this.minCommunityTokensToCreateProposal =
      args.minCommunityTokensToCreateProposal;
    this.minInstructionHoldUpTime = args.minInstructionHoldUpTime;
    this.maxVotingTime = args.maxVotingTime;
    this.voteWeightSource = args.voteWeightSource ?? VoteWeightSource.Deposit;
    this.proposalCoolOffTime = args.proposalCoolOffTime ?? 0;
    this.minCouncilTokensToCreateProposal =
      args.minCouncilTokensToCreateProposal;
  }
}

export class Governance {
  accountType: GovernanceAccountType;
  realm: PublicKey;
  governedAccount: PublicKey;
  config: GovernanceConfig;
  proposalCount: number;
  reserved?: Uint8Array;

  constructor(args: {
    realm: PublicKey;
    governedAccount: PublicKey;
    accountType: number;
    config: GovernanceConfig;
    reserved?: Uint8Array;
    proposalCount: number;
  }) {
    this.accountType = args.accountType;
    this.realm = args.realm;
    this.governedAccount = args.governedAccount;
    this.config = args.config;
    this.reserved = args.reserved;
    this.proposalCount = args.proposalCount;
  }

  isProgramGovernance() {
    return this.accountType === GovernanceAccountType.ProgramGovernance;
  }

  isAccountGovernance() {
    return this.accountType === GovernanceAccountType.AccountGovernance;
  }

  isMintGovernance() {
    return this.accountType === GovernanceAccountType.MintGovernance;
  }

  isTokenGovernance() {
    return this.accountType === GovernanceAccountType.TokenGovernance;
  }
}

export class TokenOwnerRecord {
  accountType = GovernanceAccountType.TokenOwnerRecord;

  realm: PublicKey;

  governingTokenMint: PublicKey;

  governingTokenOwner: PublicKey;

  governingTokenDepositAmount: BN;

  unrelinquishedVotesCount: number;

  totalVotesCount: number;

  outstandingProposalCount: number;

  reserved: Uint8Array;

  governanceDelegate?: PublicKey;

  constructor(args: {
    realm: PublicKey;
    governingTokenMint: PublicKey;
    governingTokenOwner: PublicKey;
    governingTokenDepositAmount: BN;
    unrelinquishedVotesCount: number;
    totalVotesCount: number;
    outstandingProposalCount: number;
    reserved: Uint8Array;
  }) {
    this.realm = args.realm;
    this.governingTokenMint = args.governingTokenMint;
    this.governingTokenOwner = args.governingTokenOwner;
    this.governingTokenDepositAmount = args.governingTokenDepositAmount;
    this.unrelinquishedVotesCount = args.unrelinquishedVotesCount;
    this.totalVotesCount = args.totalVotesCount;
    this.outstandingProposalCount = args.outstandingProposalCount;
    this.reserved = args.reserved;
  }
}

export async function getTokenOwnerRecordAddress(
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
) {
  const [tokenOwnerRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      realm.toBuffer(),
      governingTokenMint.toBuffer(),
      governingTokenOwner.toBuffer(),
    ],
    programId,
  );

  return tokenOwnerRecordAddress;
}

export enum ProposalState {
  Draft,

  SigningOff,

  Voting,

  Succeeded,

  Executing,

  Completed,

  Cancelled,

  Defeated,

  ExecutingWithErrors,
}

export enum OptionVoteResult {
  None,
  Succeeded,
  Defeated,
}

export class ProposalOption {
  label: string;
  voteWeight: BN;
  voteResult: OptionVoteResult;

  instructionsExecutedCount: number;
  instructionsCount: number;
  instructionsNextIndex: number;

  constructor(args: {
    label: string;
    voteWeight: BN;
    voteResult: OptionVoteResult;
    instructionsExecutedCount: number;
    instructionsCount: number;
    instructionsNextIndex: number;
  }) {
    this.label = args.label;
    this.voteWeight = args.voteWeight;
    this.voteResult = args.voteResult;
    this.instructionsExecutedCount = args.instructionsExecutedCount;
    this.instructionsCount = args.instructionsCount;
    this.instructionsNextIndex = args.instructionsNextIndex;
  }
}

export class Proposal {
  accountType: GovernanceAccountType;

  governance: PublicKey;

  governingTokenMint: PublicKey;

  state: ProposalState;

  tokenOwnerRecord: PublicKey;

  signatoriesCount: number;

  signatoriesSignedOffCount: number;

  // V1 -----------------------------
  yesVotesCount: BN;
  noVotesCount: BN;
  instructionsExecutedCount: number;
  instructionsCount: number;
  instructionsNextIndex: number;
  // --------------------------------

  // V2 -----------------------------
  voteType: VoteType;
  options: ProposalOption[];
  denyVoteWeight: BN | undefined;
  // --------------------------------

  draftAt: BN;

  signingOffAt: BN | null;

  votingAt: BN | null;

  votingAtSlot: BN | null;

  votingCompletedAt: BN | null;

  executingAt: BN | null;

  closedAt: BN | null;

  executionFlags: InstructionExecutionFlags;

  maxVoteWeight: BN | null;
  voteThresholdPercentage: VoteThresholdPercentage | null;

  name: string;

  descriptionLink: string;

  constructor(args: {
    accountType: GovernanceAccountType;
    governance: PublicKey;
    governingTokenMint: PublicKey;
    state: ProposalState;
    tokenOwnerRecord: PublicKey;
    signatoriesCount: number;
    signatoriesSignedOffCount: number;
    descriptionLink: string;
    name: string;
    // V1
    yesVotesCount: BN;
    noVotesCount: BN;
    instructionsExecutedCount: number;
    instructionsCount: number;
    instructionsNextIndex: number;
    //

    // V2
    voteType: VoteType;
    options: ProposalOption[];
    denyVoteWeight: BN | undefined;
    //

    draftAt: BN;
    signingOffAt: BN | null;
    votingAt: BN | null;
    votingAtSlot: BN | null;
    votingCompletedAt: BN | null;
    executingAt: BN | null;
    closedAt: BN | null;

    executionFlags: InstructionExecutionFlags;
    maxVoteWeight: BN | null;
    voteThresholdPercentage: VoteThresholdPercentage | null;
  }) {
    this.accountType = args.accountType;
    this.governance = args.governance;
    this.governingTokenMint = args.governingTokenMint;
    this.state = args.state;
    this.tokenOwnerRecord = args.tokenOwnerRecord;
    this.signatoriesCount = args.signatoriesCount;
    this.signatoriesSignedOffCount = args.signatoriesSignedOffCount;
    this.descriptionLink = args.descriptionLink;
    this.name = args.name;

    // V1
    this.yesVotesCount = args.yesVotesCount;
    this.noVotesCount = args.noVotesCount;
    this.instructionsExecutedCount = args.instructionsExecutedCount;
    this.instructionsCount = args.instructionsCount;
    this.instructionsNextIndex = args.instructionsNextIndex;
    //

    // V2
    this.voteType = args.voteType;
    this.options = args.options;
    this.denyVoteWeight = args.denyVoteWeight;

    this.draftAt = args.draftAt;
    this.signingOffAt = args.signingOffAt;
    this.votingAt = args.votingAt;
    this.votingAtSlot = args.votingAtSlot;
    this.votingCompletedAt = args.votingCompletedAt;
    this.executingAt = args.executingAt;
    this.closedAt = args.closedAt;

    this.executionFlags = args.executionFlags;
    this.maxVoteWeight = args.maxVoteWeight;
    this.voteThresholdPercentage = args.voteThresholdPercentage;
  }

  /// Returns true if Proposal is in state when no voting can happen any longer
  isVoteFinalized(): boolean {
    switch (this.state) {
      case ProposalState.Succeeded:
      case ProposalState.Executing:
      case ProposalState.Completed:
      case ProposalState.Cancelled:
      case ProposalState.Defeated:
      case ProposalState.ExecutingWithErrors:
        return true;
      case ProposalState.Draft:
      case ProposalState.SigningOff:
      case ProposalState.Voting:
        return false;
    }
  }

  isFinalState(): boolean {
    // 1) ExecutingWithErrors is not really a final state, it's undefined.
    //    However it usually indicates none recoverable execution error so we treat is as final for the ui purposes
    // 2) Succeeded with no instructions is also treated as final since it can't transition any longer
    //    It really doesn't make any sense but until it's solved in the program we have to consider it as final in the ui
    switch (this.state) {
      case ProposalState.Completed:
      case ProposalState.Cancelled:
      case ProposalState.Defeated:
      case ProposalState.ExecutingWithErrors:
        return true;
      case ProposalState.Succeeded:
        return this.instructionsCount === 0;
      case ProposalState.Executing:
      case ProposalState.Draft:
      case ProposalState.SigningOff:
      case ProposalState.Voting:
        return false;
    }
  }

  getStateTimestamp(): number {
    switch (this.state) {
      case ProposalState.Succeeded:
      case ProposalState.Defeated:
        return this.votingCompletedAt ? this.votingCompletedAt.toNumber() : 0;
      case ProposalState.Completed:
      case ProposalState.Cancelled:
        return this.closedAt ? this.closedAt.toNumber() : 0;
      case ProposalState.Executing:
      case ProposalState.ExecutingWithErrors:
        return this.executingAt ? this.executingAt.toNumber() : 0;
      case ProposalState.Draft:
        return this.draftAt.toNumber();
      case ProposalState.SigningOff:
        return this.signingOffAt ? this.signingOffAt.toNumber() : 0;
      case ProposalState.Voting:
        return this.votingAt ? this.votingAt.toNumber() : 0;
    }
  }

  getStateSortRank(): number {
    // Always show proposals in voting state at the top
    if (this.state === ProposalState.Voting) {
      return 2;
    }
    // Then show proposals in pending state and finalized at the end
    return this.isFinalState() ? 0 : 1;
  }

  /// Returns true if Proposal has not been voted on yet
  isPreVotingState() {
    return !this.votingAtSlot;
  }

  getYesVoteOption() {
    if (this.options.length !== 1 && !this.voteType.isSingleChoice()) {
      throw new Error('Proposal is not Yes/No vote');
    }

    return this.options[0];
  }

  getYesVoteCount() {
    switch (this.accountType) {
      case GovernanceAccountType.ProposalV1:
        return this.yesVotesCount;
      case GovernanceAccountType.ProposalV2:
        return this.getYesVoteOption().voteWeight;
      default:
        throw new Error(`Invalid account type ${this.accountType}`);
    }
  }

  getNoVoteCount() {
    switch (this.accountType) {
      case GovernanceAccountType.ProposalV1:
        return this.noVotesCount;
      case GovernanceAccountType.ProposalV2:
        return this.denyVoteWeight as BN;
      default:
        throw new Error(`Invalid account type ${this.accountType}`);
    }
  }

  getTimeToVoteEnd(governance: Governance) {
    const now = moment().unix();

    return this.isPreVotingState()
      ? governance.config.maxVotingTime
      : (this.votingAt?.toNumber() ?? 0) +
          governance.config.maxVotingTime -
          now;
  }

  hasVoteTimeEnded(governance: Governance) {
    return this.getTimeToVoteEnd(governance) <= 0;
  }

  canCancel(governance: Governance) {
    if (
      this.state === ProposalState.Draft ||
      this.state === ProposalState.SigningOff
    ) {
      return true;
    }

    if (
      this.state === ProposalState.Voting &&
      !this.hasVoteTimeEnded(governance)
    ) {
      return true;
    }

    return false;
  }

  canWalletCancel(
    governance: Governance,
    proposalOwner: TokenOwnerRecord,
    walletPk: PublicKey,
  ) {
    if (!this.canCancel(governance)) {
      return false;
    }
    return (
      proposalOwner.governingTokenOwner.equals(walletPk) ||
      proposalOwner.governanceDelegate?.equals(walletPk)
    );
  }
}

export class SignatoryRecord {
  accountType: GovernanceAccountType = GovernanceAccountType.SignatoryRecord;
  proposal: PublicKey;
  signatory: PublicKey;
  signedOff: boolean;

  constructor(args: {
    proposal: PublicKey;
    signatory: PublicKey;
    signedOff: boolean;
  }) {
    this.proposal = args.proposal;
    this.signatory = args.signatory;
    this.signedOff = !!args.signedOff;
  }
}

export async function getSignatoryRecordAddress(
  programId: PublicKey,
  proposal: PublicKey,
  signatory: PublicKey,
) {
  const [signatoryRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      proposal.toBuffer(),
      signatory.toBuffer(),
    ],
    programId,
  );

  return signatoryRecordAddress;
}

export class VoteWeight {
  yes: BN;
  no: BN;

  constructor(args: { yes: BN; no: BN }) {
    this.yes = args.yes;
    this.no = args.no;
  }
}

export class VoteRecord {
  accountType: GovernanceAccountType;
  proposal: PublicKey;
  governingTokenOwner: PublicKey;
  isRelinquished: boolean;

  // V1
  voteWeight: VoteWeight | undefined;

  // V2 -------------------------------
  voterWeight: BN | undefined;
  vote: Vote | undefined;
  // -------------------------------

  constructor(args: {
    accountType: GovernanceAccountType;
    proposal: PublicKey;
    governingTokenOwner: PublicKey;
    isRelinquished: boolean;
    // V1
    voteWeight: VoteWeight | undefined;
    // V2 -------------------------------
    voterWeight: BN | undefined;
    vote: Vote | undefined;
    // -------------------------------
  }) {
    this.accountType = args.accountType;
    this.proposal = args.proposal;
    this.governingTokenOwner = args.governingTokenOwner;
    this.isRelinquished = !!args.isRelinquished;
    // V1
    this.voteWeight = args.voteWeight;
    // V2 -------------------------------
    this.voterWeight = args.voterWeight;
    this.vote = args.vote;
    // -------------------------------
  }

  getNoVoteWeight() {
    switch (this.accountType) {
      case GovernanceAccountType.VoteRecordV1: {
        return this.voteWeight?.no;
      }
      case GovernanceAccountType.VoteRecordV2: {
        switch (this.vote?.voteType) {
          case VoteKind.Approve: {
            return undefined;
          }
          case VoteKind.Deny: {
            return this.voterWeight;
          }
          default:
            throw new Error('Invalid voteKind');
        }
      }
      default:
        throw new Error(`Invalid account type ${this.accountType} `);
    }
  }
  getYesVoteWeight() {
    switch (this.accountType) {
      case GovernanceAccountType.VoteRecordV1: {
        return this.voteWeight?.yes;
      }
      case GovernanceAccountType.VoteRecordV2: {
        switch (this.vote?.voteType) {
          case VoteKind.Approve: {
            return this.voterWeight;
          }
          case VoteKind.Deny: {
            return undefined;
          }
          default:
            throw new Error('Invalid voteKind');
        }
      }
      default:
        throw new Error(`Invalid account type ${this.accountType} `);
    }
  }
}

export async function getVoteRecordAddress(
  programId: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
) {
  const [voteRecordAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from(GOVERNANCE_PROGRAM_SEED),
      proposal.toBuffer(),
      tokenOwnerRecord.toBuffer(),
    ],
    programId,
  );

  return voteRecordAddress;
}

export class AccountMetaData {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;

  constructor(args: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }) {
    this.pubkey = args.pubkey;
    this.isSigner = !!args.isSigner;
    this.isWritable = !!args.isWritable;
  }
}

export class InstructionData {
  programId: PublicKey;
  accounts: AccountMetaData[];
  data: Uint8Array;

  constructor(args: {
    programId: PublicKey;
    accounts: AccountMetaData[];
    data: Uint8Array;
  }) {
    this.programId = args.programId;
    this.accounts = args.accounts;
    this.data = args.data;
  }
}

export class ProposalInstruction {
  accountType = GovernanceAccountType.ProposalInstructionV1;
  proposal: PublicKey;
  instructionIndex: number;
  // V2
  optionIndex: number;

  holdUpTime: number;
  instruction: InstructionData;
  executedAt: BN | null;
  executionStatus: InstructionExecutionStatus;

  constructor(args: {
    proposal: PublicKey;
    instructionIndex: number;
    optionIndex: number;
    holdUpTime: number;
    instruction: InstructionData;
    executedAt: BN | null;
    executionStatus: InstructionExecutionStatus;
  }) {
    this.proposal = args.proposal;
    this.instructionIndex = args.instructionIndex;
    this.optionIndex = args.optionIndex;
    this.holdUpTime = args.holdUpTime;
    this.instruction = args.instruction;
    this.executedAt = args.executedAt;
    this.executionStatus = args.executionStatus;
  }
}

export async function getProposalInstructionAddress(
  programId: PublicKey,
  programVersion: number,
  proposal: PublicKey,
  optionIndex: number,
  instructionIndex: number,
) {
  let optionIndexBuffer = Buffer.alloc(2);
  optionIndexBuffer.writeInt16LE(optionIndex, 0);

  let instructionIndexBuffer = Buffer.alloc(2);
  instructionIndexBuffer.writeInt16LE(instructionIndex, 0);

  const seeds =
    programVersion === PROGRAM_VERSION_V1
      ? [
          Buffer.from(GOVERNANCE_PROGRAM_SEED),
          proposal.toBuffer(),
          instructionIndexBuffer,
        ]
      : [
          Buffer.from(GOVERNANCE_PROGRAM_SEED),
          proposal.toBuffer(),
          optionIndexBuffer,
          instructionIndexBuffer,
        ];

  const [instructionAddress] = await PublicKey.findProgramAddress(
    seeds,
    programId,
  );

  return instructionAddress;
}

export class ProgramMetadata {
  accountType = GovernanceAccountType.ProgramMetadata;

  updatedAt: BN;

  version: string;

  reserved: Uint8Array;

  constructor(args: {
    updatedAt: BN;
    reserved: Uint8Array;

    version: string;
  }) {
    this.updatedAt = args.updatedAt;
    this.reserved = args.reserved;
    this.version = args.version;
  }
}

export async function getProgramMetadataAddress(programId: PublicKey) {
  const [signatoryRecordAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('metadata')],
    programId,
  );

  return signatoryRecordAddress;
}

export async function getNativeTreasuryAddress(
  programId: PublicKey,
  governance: PublicKey,
) {
  const [signatoryRecordAddress] = await PublicKey.findProgramAddress(
    [Buffer.from('native-treasury'), governance.toBuffer()],
    programId,
  );

  return signatoryRecordAddress;
}