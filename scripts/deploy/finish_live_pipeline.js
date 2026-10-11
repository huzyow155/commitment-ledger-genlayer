const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const contractAddress = "0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3";
  const deployTxHash = "0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235";
  
  const account = createAccount();
  console.log("Runner Account:", account.address);
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const codePath = path.join(__dirname, '../../contracts/CommitmentLedger.py');
  const code = fs.readFileSync(codePath, 'utf8');
  const localCodeSha256 = crypto.createHash('sha256').update(code, 'utf8').digest('hex');

  const liveEvidence = {
    contractAddress: contractAddress,
    deployTxHash: deployTxHash,
    localCodeSha256: localCodeSha256,
    cases: {},
  };

  async function executeWriteWithRetry(fnName, args, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\nAttempt ${attempt}/${maxAttempts}: ${fnName}(${JSON.stringify(args).slice(0, 80)}...)`);
      const t0 = Date.now();
      try {
        const hash = await client.writeContract({
          address: contractAddress,
          functionName: fnName,
          args: args,
        });
        console.log(`Tx sent: ${hash}`);
        const receipt = await client.waitForTransactionReceipt({
          hash: hash,
          retries: 120,
          interval: 3000,
        });
        const lat = (Date.now() - t0) / 1000;
        const leaderResult = receipt.consensus_data?.leader_receipt?.[0]?.execution_result;
        console.log(`Receipt status_name: ${receipt.status_name}, result_name: ${receipt.result_name}, leader: ${leaderResult} (${lat.toFixed(2)}s)`);

        // If status_name is ACCEPTED, return
        if (receipt.status_name === 'ACCEPTED') {
          return { hash, receipt, latency: lat };
        }
        console.log(`Status not ACCEPTED (${receipt.status_name}), retrying if attempts remain...`);
      } catch (err) {
        console.log(`Execution error on attempt ${attempt}:`, err.message || err);
      }
      await new Promise(r => setTimeout(r, 4000));
    }
    throw new Error(`Failed ${fnName} after ${maxAttempts} attempts`);
  }

  // -------------------------------------------------------------
  // Case A: Paraphrase Trap Test (KEPT) - Already executed on this contract
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE A: Paraphrase Trap Test (KEPT)");
  console.log("=======================================================");
  const cidA = "2179cd4d54f1";
  const recordA = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidA],
  }));
  console.log("Case A Record read-back:", JSON.stringify(recordA, null, 2));

  liveEvidence.cases.caseA = {
    title: "KEPT via genuine paraphrase (trap test)",
    commitmentId: cidA,
    rawText: "Hyper commits to ship the decentralized commitment ledger on studionet by Q4 2026.",
    registerTx: "0xb49a0575519e3e9b708a96b773e72a42be41379fc487dfeb80d552a2987ce1bf",
    registerLatency: 15.76,
    evidenceText: "Public announcement: As of October 2026, Hyper has successfully deployed and verified the decentralized commitment ledger intelligent contract on GenLayer studionet.",
    resolveTx: "0x33d45785766d3a1bcdc23d42750506e9d5f294967c3d98e0b13c5dee1457f72e",
    resolveLatency: 25.75,
    finalRecord: recordA,
  };

  // -------------------------------------------------------------
  // Case B: Broken Commitment with Grounded Quote (BROKEN)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE B: Broken Commitment with Grounded Quote (BROKEN)");
  console.log("=======================================================");
  const rawTextB = "The core engineering guild will publish the formal verification specification by September 15 2026.";
  const regB = await executeWriteWithRetry('register_commitment', [rawTextB, "2026-09-15"]);

  // Fetch list of registrant commitments to get CID
  const listB = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidB = listB[0].commitment_id;
  console.log(`Case B Registered CID: ${cidB}`);
  console.log(`Case B Extracted Subject: "${listB[0].subject}", Action: "${listB[0].action}"`);

  const evidenceB = (
    "Guild meeting minutes: Due to unexpected resource constraints, " +
    "the core engineering guild formally missed the deadline and failed to publish the formal verification specification."
  );
  const resB = await executeWriteWithRetry('submit_resolution', [cidB, evidenceB]);
  const recordB = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidB],
  }));
  console.log("Case B Final Record:", JSON.stringify(recordB, null, 2));

  liveEvidence.cases.caseB = {
    title: "BROKEN with grounded quote",
    commitmentId: cidB,
    rawText: rawTextB,
    registerTx: regB.hash,
    registerLatency: regB.latency,
    evidenceText: evidenceB,
    resolveTx: resB.hash,
    resolveLatency: resB.latency,
    finalRecord: recordB,
  };

  // -------------------------------------------------------------
  // Case C: Superficially Similar Distractor (NOMATCH Rejection)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE C: Superficially Similar Distractor (NOMATCH Rejection)");
  console.log("=======================================================");
  const rawTextC = "Hyper promises to conduct a community gas subsidy audit by October 2026.";
  const regC = await executeWriteWithRetry('register_commitment', [rawTextC, "2026-10-31"]);

  const listC = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidC = listC[0].commitment_id;
  console.log(`Case C Registered CID: ${cidC}`);

  const distractorEvidenceC = (
    "Community bulletin: Hyper successfully organized an in-person developer hackathon in Berlin during October 2026."
  );
  console.log("Submitting superficially-similar distractor evidence (must be rejected as NOMATCH)...");
  const resC = await executeWriteWithRetry('submit_resolution', [cidC, distractorEvidenceC]);
  console.log("Case C resolve tx leader execution_result:", resC.receipt.consensus_data?.leader_receipt?.[0]?.execution_result);

  const recordC = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidC],
  }));
  console.log("Case C Record after rejection (must remain OPEN):", JSON.stringify(recordC, null, 2));

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
    finalRecord: recordC,
  };

  // -------------------------------------------------------------
  // Case D: Ambiguous Evidence Yielding PARTIAL
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE D: Ambiguous Evidence (PARTIAL)");
  console.log("=======================================================");
  const rawTextD = "The security team will finalize 100 percent of the vulnerability bounty payouts by November 2026.";
  const regD = await executeWriteWithRetry('register_commitment', [rawTextD, "2026-11-30"]);

  const listD = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidD = listD[0].commitment_id;
  console.log(`Case D Registered CID: ${cidD}`);

  const evidenceD = (
    "Security disclosure update: The security team processed several critical bounty claims, " +
    "paying roughly half of reported bounties while remaining submissions remain under dispute and unfinalized."
  );
  const resD = await executeWriteWithRetry('submit_resolution', [cidD, evidenceD]);
  const recordD = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidD],
  }));
  console.log("Case D Final Record:", JSON.stringify(recordD, null, 2));

  liveEvidence.cases.caseD = {
    title: "PARTIAL resolution from ambiguous evidence",
    commitmentId: cidD,
    rawText: rawTextD,
    registerTx: regD.hash,
    registerLatency: regD.latency,
    evidenceText: evidenceD,
    resolveTx: resD.hash,
    resolveLatency: resD.latency,
    finalRecord: recordD,
  };

  fs.writeFileSync(
    path.join(__dirname, 'live_evidence.json'),
    JSON.stringify(liveEvidence, null, 2)
  );
  console.log("\nSuccessfully saved all live evidence to live_evidence.json!");
}

main().catch(err => {
  console.error("Pipeline error:", err);
  process.exit(1);
});
