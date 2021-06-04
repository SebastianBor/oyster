import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { contexts, utils, models, ParsedAccount } from '@oyster/common';
import {
  CustomSingleSignerTransactionLayout,
  ProposalOld,
  ProposalStateOld,
} from '../models/serialisation';
import { addCustomSingleSignerTransactionInstruction } from '../models/addCustomSingleSignerTransaction';
import { GOVERNANCE_PROGRAM_SEED } from '../models/accounts';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;
const { approve } = models;

export const addCustomSingleSignerTransaction = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<ProposalOld> | null,
  state: ParsedAccount<ProposalStateOld>,
  sigAccount: PublicKey,
  slot: string,
  instruction: string,
  position: number,
) => {
  const PROGRAM_IDS = utils.programIds();

  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  const rentExempt = await connection.getMinimumBalanceForRentExemption(
    CustomSingleSignerTransactionLayout.span,
  );

  const txnKey = new Account();

  const uninitializedTxnInstruction = SystemProgram.createAccount({
    fromPubkey: wallet.publicKey,
    newAccountPubkey: txnKey.publicKey,
    lamports: rentExempt,
    space: CustomSingleSignerTransactionLayout.span,
    programId: PROGRAM_IDS.governance.programId,
  });

  const [authority] = await PublicKey.findProgramAddress(
    [Buffer.from(GOVERNANCE_PROGRAM_SEED), proposal!.pubkey.toBuffer()],
    PROGRAM_IDS.governance.programId,
  );

  signers.push(txnKey);

  instructions.push(uninitializedTxnInstruction);

  const transferAuthority = approve(
    instructions,
    [],
    sigAccount,
    wallet.publicKey,
    1,
  );
  signers.push(transferAuthority);

  /*instruction = (
    await serializeInstruction({
      connection,
      instr: pingInstruction(),
      proposal
    })
  ).base64;

  console.log(pingInstruction());
  const asArr = (
    await serializeInstruction({
      connection,
      instr: pingInstruction(),
      proposal
    })
  ).byteArray;

  console.log(asArr);
  console.log('Message', Message.from(asArr));*/

  instructions.push(
    addCustomSingleSignerTransactionInstruction(
      txnKey.publicKey,
      state.pubkey,
      sigAccount,
      proposal!.info.signatoryValidation,
      proposal!.pubkey,
      proposal!.info.config,
      transferAuthority.publicKey,
      authority,
      slot,
      instruction,
      position,
    ),
  );

  notify({
    message: 'Adding transaction...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions,
      signers,
      true,
    );

    notify({
      message: 'Transaction added.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw new Error();
  }
};
