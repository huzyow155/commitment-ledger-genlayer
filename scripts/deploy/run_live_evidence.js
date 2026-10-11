const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const account = createAccount();
  console.log("Deployer account:", account.address);

  // Save account to demo_accounts.json
  const demoAccounts = {
    deployer: account.address,
    privateKey: account.privateKey,
  };
  fs.writeFileSync(
    path.join(__dirname, 'demo_accounts.json'),
    JSON.stringify(demoAccounts, null, 2)
  );

  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const codePath = path.join(__dirname, '../../contracts/CommitmentLedger.py');
  const code = fs.readFileSync(codePath, 'utf8');
  const localCodeSha256 = crypto.createHash('sha256').update(code, 'utf8').digest('hex');
  console.log("Local contract source sha256:", localCodeSha256);

  console.log("\n=======================================================");
  console.log("STAGE 1: Deploying Final CommitmentLedger Contract");
  console.log("=======================================================");
  const deployStartTime = Date.now();
  const deployTxHash = await client.deployContract({
    code: code,
    args: [],
  });
  console.log("Deploy Tx Hash:", deployTxHash);

  const deployReceipt = await client.waitForTransactionReceipt({
    hash: deployTxHash,
    retries: 120,
    interval: 3000,
  });
  const deployLatency = (Date.now() - deployStartTime) / 1000;
  console.log(`Deploy completed in ${deployLatency.toFixed(2)}s`);
  console.log("Deploy status_name:", deployReceipt.status_name);
  console.log("Deploy result_name:", deployReceipt.result_name);
  const contractAddress = deployReceipt.recipient;
  console.log("Contract Address:", contractAddress);

  if (!contractAddress) {
    throw new Error("No contract address in deployment receipt!");
  }

  const liveEvidence = {
    contractAddress: contractAddress,
    deployTxHash: deployTxHash,
    deployLatencySec: deployLatency,
    deployReceipt: deployReceipt,
    cases: {},
  };

  // Helper for write & wait
  async function executeWrite(fnName, args) {
    const t0 = Date.now();
    const hash = await client.writeContract({
      address: contractAddress,
      functionName: fnName,
      args: args,
    });
    console.log(`Tx sent: ${fnName} -> ${hash}`);
    const receipt = await client.waitForTransactionReceipt({
      hash: hash,
      retries: 120,
      interval: 3000,
    });
    const lat = (Date.now() - t0) / 1000;
    console.log(`Receipt: ${receipt.status_name} (result_name: ${receipt.result_name}, leader: ${receipt.consensus_data?.leader_receipt?.[0]?.execution_result}) in ${lat.toFixed(2)}s`);
    return { hash, receipt, latency: lat };
  }

  // -------------------------------------------------------------
  // Case A: Paraphrase Trap Test (KEPT)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE A: Paraphrase Trap Test (KEPT)");
  console.log("=======================================================");
  const rawTextA = "Hyper pledges to launch the cross-chain liquidity aggregator on studionet before Q4 2026 ends.";
  const regA = await executeWrite('register_commitment', [rawTextA, "2026-12-31"]);
  
  // Read back registrant commitments to obtain commitment_id
  const listA = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidA = listA[0].commitment_id;
  console.log(`Case A registered CID: ${cidA}`);
  console.log(`Case A extracted subject: "${listA[0].subject}", action: "${listA[0].action}"`);

  // Evidence A: Genuine paraphrase (synonyms, passive/active voice, reordered clauses)
  const evidenceA = (
    "Production report: Ahead of the fourth quarter deadline in 2026, " +
    "the cross-chain liquidity aggregator was successfully rolled out by Hyper on studionet."
  );
  const resA = await executeWrite('submit_resolution', [cidA, evidenceA]);
  const finalRecordA = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidA],
  }));
  console.log("Case A Final Record:", JSON.stringify(finalRecordA, null, 2));

  liveEvidence.cases.caseA = {
    title: "KEPT via genuine paraphrase (trap test)",
    commitmentId: cidA,
    rawText: rawTextA,
    registerTx: regA.hash,
    registerLatency: regA.latency,
    evidenceText: evidenceA,
    resolveTx: resA.hash,
    resolveLatency: resA.latency,
    finalRecord: finalRecordA,
  };

  // -------------------------------------------------------------
  // Case B: Broken Commitment with Grounded Quote (BROKEN)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE B: Broken Commitment with Grounded Quote (BROKEN)");
  console.log("=======================================================");
  const rawTextB = "The core engineering guild will publish the formal verification specification by September 15 2026.";
  const regB = await executeWrite('register_commitment', [rawTextB, "2026-09-15"]);
  const listB = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidB = listB[0].commitment_id;
  console.log(`Case B registered CID: ${cidB}`);

  const evidenceB = (
    "Guild meeting minutes: Due to unexpected resource constraints, " +
    "the core engineering guild formally missed the deadline and failed to publish the formal verification specification."
  );
  const resB = await executeWrite('submit_resolution', [cidB, evidenceB]);
  const finalRecordB = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidB],
  }));
  console.log("Case B Final Record:", JSON.stringify(finalRecordB, null, 2));

  liveEvidence.cases.caseB = {
    title: "BROKEN with grounded quote",
    commitmentId: cidB,
    rawText: rawTextB,
    registerTx: regB.hash,
    registerLatency: regB.latency,
    evidenceText: evidenceB,
    resolveTx: resB.hash,
    resolveLatency: resB.latency,
    finalRecord: finalRecordB,
  };

  // -------------------------------------------------------------
  // Case C: Superficially Similar Distractor Rejected as NOMATCH
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE C: Superficially Similar Distractor (NOMATCH Rejection)");
  console.log("=======================================================");
  const rawTextC = "Hyper promises to conduct a community gas subsidy audit by October 2026.";
  const regC = await executeWrite('register_commitment', [rawTextC, "2026-10-31"]);
  const listC = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidC = listC[0].commitment_id;
  console.log(`Case C registered CID: ${cidC}`);

  // Distractor: Same subject 'Hyper' and same timeframe, but completely different action
  const distractorEvidenceC = (
    "Community bulletin: Hyper successfully organized an in-person developer hackathon in Berlin during October 2026."
  );
  console.log("Attempting resolution with superficially-similar distractor...");
  const resC = await executeWrite('submit_resolution', [cidC, distractorEvidenceC]);
  const finalRecordC = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidC],
  }));
  console.log("Case C Record after rejection attempt (must be OPEN):", JSON.stringify(finalRecordC, null, 2));

  liveEvidence.cases.caseC = {
    title: "Correctly rejected as NOMATCH (trap test distractor)",
    commitmentId: cidC,
    rawText: rawTextC,
    registerTx: regC.hash,
    registerLatency: regC.latency,
    evidenceText: distractorEvidenceC,
    resolveTx: resC.hash,
    resolveLatency: resC.latency,
    resolveReceiptLeaderResult: resC.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    finalRecord: finalRecordC,
  };

  // -------------------------------------------------------------
  // Case D: Ambiguous Evidence Yielding PARTIAL
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE D: Ambiguous Evidence (PARTIAL)");
  console.log("=======================================================");
  const rawTextD = "The security team will finalize 100 percent of the vulnerability bounty payouts by November 2026.";
  const regD = await executeWrite('register_commitment', [rawTextD, "2026-11-30"]);
  const listD = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidD = listD[0].commitment_id;
  console.log(`Case D registered CID: ${cidD}`);

  // Ambiguous evidence: some bounties paid, some disputed/unfinalized
  const evidenceD = (
    "Security disclosure update: The security team processed several critical bounty claims, " +
    "paying roughly half of reported bounties while remaining submissions remain under dispute and unfinalized."
  );
  const resD = await executeWrite('submit_resolution', [cidD, evidenceD]);
  const finalRecordD = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidD],
  }));
  console.log("Case D Final Record:", JSON.stringify(finalRecordD, null, 2));

  liveEvidence.cases.caseD = {
    title: "PARTIAL resolution from ambiguous evidence",
    commitmentId: cidD,
    rawText: rawTextD,
    registerTx: regD.hash,
    registerLatency: regD.latency,
    evidenceText: evidenceD,
    resolveTx: resD.hash,
    resolveLatency: resD.latency,
    finalRecord: finalRecordD,
  };

  fs.writeFileSync(
    path.join(__dirname, 'live_evidence.json'),
    JSON.stringify(liveEvidence, null, 2)
  );
  console.log("\nSaved all live evidence to live_evidence.json");
}

main().catch(err => {
  console.error("Milestone 4 evidence execution error:", err);
  process.exit(1);
});
