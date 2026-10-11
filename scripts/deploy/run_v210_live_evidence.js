const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'deployments.json'), 'utf8')
  );
  const contractAddress = deployments.contractAddress;
  const deployTxHash = deployments.deployTxHash;

  console.log(`Target Contract Address: ${contractAddress}`);
  console.log(`Deploy Tx: ${deployTxHash}`);

  const account = createAccount();
  console.log(`Caller account: ${account.address}`);

  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const liveEvidence = {
    contractAddress: contractAddress,
    deployTxHash: deployTxHash,
    cases: {},
    negativeTests: {},
  };

  async function executeWriteWithRetry(fnName, args, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\nAttempt ${attempt}/${maxAttempts}: ${fnName}(${JSON.stringify(args).slice(0, 100)}...)`);
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
        console.log(`Receipt: status_name=${receipt.status_name}, result_name=${receipt.result_name}, leader=${leaderResult} in ${lat.toFixed(2)}s`);
        return { hash, receipt, latency: lat };
      } catch (err) {
        console.log(`Execution error on attempt ${attempt}:`, err.message || err);
      }
      await new Promise(r => setTimeout(r, 4000));
    }
    throw new Error(`Failed ${fnName} after ${maxAttempts} attempts`);
  }

  // -------------------------------------------------------------
  // Case A: Historical Apollo 11 lunar landing pledge (KEPT)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE A: Apollo 11 lunar landing (KEPT)");
  console.log("=======================================================");
  const rawTextA = "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.";
  const deadlineA = "1970-01-01"; // Strict past calendar date YYYY-MM-DD
  const sourceA = "https://en.wikipedia.org/wiki/Apollo_11";

  const regA = await executeWriteWithRetry('register_commitment', [rawTextA, deadlineA]);
  const listA = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidA = listA[0].commitment_id;
  console.log(`Case A CID: ${cidA}, subject="${listA[0].subject}", action="${listA[0].action}"`);

  const resA = await executeWriteWithRetry('submit_resolution', [cidA, sourceA]);
  const finalRecordA = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidA],
  }));
  console.log("Case A Final Record:", JSON.stringify(finalRecordA, null, 2));

  liveEvidence.cases.caseA = {
    title: "KEPT via genuine paraphrase from real Wikipedia source (trap test)",
    commitmentId: cidA,
    rawText: rawTextA,
    deadlineHint: deadlineA,
    sourceUrl: sourceA,
    registerTx: regA.hash,
    resolveTx: resA.hash,
    statusName: resA.receipt.status_name,
    leaderExecutionResult: resA.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    finalRecord: finalRecordA,
  };

  // -------------------------------------------------------------
  // Case B: Apollo 13 lunar landing pledge (BROKEN)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE B: Apollo 13 lunar landing (BROKEN)");
  console.log("=======================================================");
  const rawTextB = "Apollo 13 will successfully land on the Moon.";
  const deadlineB = "1970-05-01";
  const sourceB = "https://en.wikipedia.org/wiki/Apollo_13";

  const regB = await executeWriteWithRetry('register_commitment', [rawTextB, deadlineB]);
  const listB = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidB = listB[0].commitment_id;
  console.log(`Case B CID: ${cidB}`);

  const resB = await executeWriteWithRetry('submit_resolution', [cidB, sourceB]);
  const finalRecordB = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidB],
  }));
  console.log("Case B Final Record:", JSON.stringify(finalRecordB, null, 2));

  liveEvidence.cases.caseB = {
    title: "BROKEN with grounded quote from real Wikipedia source",
    commitmentId: cidB,
    rawText: rawTextB,
    deadlineHint: deadlineB,
    sourceUrl: sourceB,
    registerTx: regB.hash,
    resolveTx: resB.hash,
    statusName: resB.receipt.status_name,
    leaderExecutionResult: resB.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    finalRecord: finalRecordB,
  };

  // -------------------------------------------------------------
  // Case C: Distractor source correctly rejected as NOMATCH
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE C: Superficially Similar Distractor (NOMATCH Rejection)");
  console.log("=======================================================");
  const rawTextC = "NASA will verify the James Webb Space Telescope deployment.";
  const deadlineC = "2022-01-01";
  const distractorSourceC = "https://en.wikipedia.org/wiki/Falcon_9";

  const regC = await executeWriteWithRetry('register_commitment', [rawTextC, deadlineC]);
  const listC = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidC = listC[0].commitment_id;
  console.log(`Case C CID: ${cidC}`);

  const resC = await executeWriteWithRetry('submit_resolution', [cidC, distractorSourceC]);
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
    deadlineHint: deadlineC,
    sourceUrl: distractorSourceC,
    registerTx: regC.hash,
    resolveTx: resC.hash,
    statusName: resC.receipt.status_name,
    leaderExecutionResult: resC.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    finalRecord: finalRecordC,
  };

  // -------------------------------------------------------------
  // Case D: Ambiguous / broad objective description (PARTIAL)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE D: Broad Apollo 11 Mission Objectives (PARTIAL or Ungrounded Rejection)");
  console.log("=======================================================");
  const rawTextD = "Apollo 11 spacecraft will complete all scheduled mission objectives.";
  const deadlineD = "1970-01-01";
  const sourceD = "https://en.wikipedia.org/wiki/Apollo_11";

  const regD = await executeWriteWithRetry('register_commitment', [rawTextD, deadlineD]);
  const listD = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidD = listD[0].commitment_id;
  console.log(`Case D CID: ${cidD}`);

  const resD = await executeWriteWithRetry('submit_resolution', [cidD, sourceD]);
  const finalRecordD = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidD],
  }));
  console.log("Case D Final Record:", JSON.stringify(finalRecordD, null, 2));

  liveEvidence.cases.caseD = {
    title: "PARTIAL resolution from broad mission objectives description",
    commitmentId: cidD,
    rawText: rawTextD,
    deadlineHint: deadlineD,
    sourceUrl: sourceD,
    registerTx: regD.hash,
    resolveTx: resD.hash,
    statusName: resD.receipt.status_name,
    leaderExecutionResult: resD.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    finalRecord: finalRecordD,
  };

  // -------------------------------------------------------------
  // Negative Tests: Domain allowlist, Scheme, Free-text deadline, Pre-deadline resolution
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("NEGATIVE TESTS");
  console.log("=======================================================");

  // Neg 1: Non-allowlisted domain (github.com)
  console.log("Neg 1: Non-allowlisted domain https://github.com/nasa/webb");
  const neg1 = await executeWriteWithRetry('submit_resolution', [cidC, "https://github.com/nasa/webb"]);
  liveEvidence.negativeTests.nonAllowlistedDomain = {
    url: "https://github.com/nasa/webb",
    txHash: neg1.hash,
    statusName: neg1.receipt.status_name,
    leaderExecutionResult: neg1.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
  };

  // Neg 2: Insecure scheme (http)
  console.log("Neg 2: Insecure scheme http://en.wikipedia.org/wiki/Falcon_9");
  const neg2 = await executeWriteWithRetry('submit_resolution', [cidC, "http://en.wikipedia.org/wiki/Falcon_9"]);
  liveEvidence.negativeTests.insecureScheme = {
    url: "http://en.wikipedia.org/wiki/Falcon_9",
    txHash: neg2.hash,
    statusName: neg2.receipt.status_name,
    leaderExecutionResult: neg2.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
  };

  // Neg 3: Free-text deadline rejected at registration
  console.log("Neg 3: Free-text deadline 'end of Q2' at registration");
  const neg3 = await executeWriteWithRetry('register_commitment', ["Hyper will deploy protocol.", "end of Q2"]);
  liveEvidence.negativeTests.freeTextDeadline = {
    attemptedDeadline: "end of Q2",
    txHash: neg3.hash,
    statusName: neg3.receipt.status_name,
    leaderExecutionResult: neg3.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
  };

  // Neg 4: Resolution attempted before future deadline
  console.log("Neg 4: Resolution attempted before future deadline (2099-01-01)");
  const regNeg4 = await executeWriteWithRetry('register_commitment', ["Future lunar colony will be established.", "2099-01-01"]);
  const listNeg4 = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidNeg4 = listNeg4[0].commitment_id;
  const neg4 = await executeWriteWithRetry('submit_resolution', [cidNeg4, "https://en.wikipedia.org/wiki/Apollo_11"]);
  liveEvidence.negativeTests.prematureResolution = {
    commitmentId: cidNeg4,
    deadlineHint: "2099-01-01",
    registerTx: regNeg4.hash,
    resolveTx: neg4.hash,
    statusName: neg4.receipt.status_name,
    leaderExecutionResult: neg4.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
  };

  // Neg 5: Double resolution attempt on already-resolved commitment (cidA)
  console.log("Neg 5: Double resolution attempt on already-resolved commitment");
  const neg5 = await executeWriteWithRetry('submit_resolution', [cidA, sourceA]);
  liveEvidence.negativeTests.alreadyResolved = {
    commitmentId: cidA,
    txHash: neg5.hash,
    statusName: neg5.receipt.status_name,
    leaderExecutionResult: neg5.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
  };

  fs.writeFileSync(
    path.join(__dirname, 'live_evidence.json'),
    JSON.stringify(liveEvidence, null, 2)
  );
  console.log("\nSaved all live evidence to scripts/deploy/live_evidence.json");
}

main().catch(err => {
  console.error("Evidence execution error:", err);
  process.exit(1);
});
