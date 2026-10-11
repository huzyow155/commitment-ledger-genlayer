const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const account = createAccount();
  console.log("Using deployer address:", account.address);
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const codePath = path.join(__dirname, '../../contracts/CommitmentLedger.py');
  const code = fs.readFileSync(codePath, 'utf8');

  console.log("Deploying CommitmentLedger contract to studionet (Milestone 1)...");
  const deployTxHash = await client.deployContract({
    code: code,
    args: [],
  });
  console.log("Deploy Tx Hash:", deployTxHash);

  const receipt = await client.waitForTransactionReceipt({
    hash: deployTxHash,
    retries: 120,
    interval: 3000,
  });
  console.log("Deploy Receipt status_name:", receipt.status_name);
  console.log("Deploy Receipt result_name:", receipt.result_name);
  const contractAddress = receipt.recipient;
  console.log("Deployed CommitmentLedger Contract Address:", contractAddress);

  if (!contractAddress) {
    throw new Error("No contract address returned from deployment receipt");
  }

  // 1. Register a commitment
  console.log("\n--- Registering Commitment ---");
  const rawText = "Hyper commits to ship the decentralized commitment ledger on studionet by Q4 2026.";
  const deadlineHint = "2026-12-31";

  const regStartTime = Date.now();
  const regTxHash = await client.writeContract({
    address: contractAddress,
    functionName: 'register_commitment',
    args: [rawText, deadlineHint],
  });
  console.log("register_commitment Tx Hash:", regTxHash);

  const regReceipt = await client.waitForTransactionReceipt({
    hash: regTxHash,
    retries: 120,
    interval: 3000,
  });
  const regElapsed = (Date.now() - regStartTime) / 1000;
  console.log(`register_commitment took ${regElapsed.toFixed(2)}s`);
  console.log("register Receipt status_name:", regReceipt.status_name);
  console.log("register Receipt leader execution_result:", regReceipt.consensus_data?.leader_receipt?.[0]?.execution_result);

  // Read back registrant commitments
  const listResult = await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  });
  console.log("List commitments result:", listResult);
  const parsedList = JSON.parse(listResult);
  if (!parsedList || parsedList.length === 0) {
    throw new Error("No commitments found after registration!");
  }
  const cid = parsedList[0].commitment_id;
  console.log("Registered Commitment ID:", cid);
  console.log("Extracted Subject:", parsedList[0].subject);
  console.log("Extracted Action:", parsedList[0].action);

  // 2. Submit resolution (Real paraphrase)
  console.log("\n--- Submitting Resolution (Paraphrase) ---");
  const evidenceText = (
    "Public announcement: As of October 2026, Hyper has successfully deployed " +
    "and verified the decentralized commitment ledger intelligent contract on GenLayer studionet."
  );

  const resStartTime = Date.now();
  const resTxHash = await client.writeContract({
    address: contractAddress,
    functionName: 'submit_resolution',
    args: [cid, evidenceText],
  });
  console.log("submit_resolution Tx Hash:", resTxHash);

  const resReceipt = await client.waitForTransactionReceipt({
    hash: resTxHash,
    retries: 120,
    interval: 3000,
  });
  const resElapsed = (Date.now() - resStartTime) / 1000;
  console.log(`submit_resolution took ${resElapsed.toFixed(2)}s`);
  console.log("resolution Receipt status_name:", resReceipt.status_name);
  console.log("resolution Receipt leader execution_result:", resReceipt.consensus_data?.leader_receipt?.[0]?.execution_result);

  // 3. Read back commitment state
  const finalRecordStr = await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cid],
  });
  console.log("\nFinal Commitment Record:", finalRecordStr);
  const finalRecord = JSON.parse(finalRecordStr);

  const coreOutput = {
    deployer: account.address,
    contractAddress: contractAddress,
    deployTxHash: deployTxHash,
    deployReceipt: receipt,
    registerTxHash: regTxHash,
    registerReceipt: regReceipt,
    registerLatencySec: regElapsed,
    commitmentId: cid,
    registeredRecord: parsedList[0],
    resolveTxHash: resTxHash,
    resolveReceipt: resReceipt,
    resolveLatencySec: resElapsed,
    finalRecord: finalRecord,
  };

  fs.writeFileSync(
    path.join(__dirname, 'core_output.json'),
    JSON.stringify(coreOutput, null, 2)
  );
  console.log("Saved core round results to core_output.json");
}

main().catch(err => {
  console.error("Core deployment/execution error:", err);
  process.exit(1);
});
