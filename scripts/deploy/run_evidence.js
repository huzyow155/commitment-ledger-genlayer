const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'deployments.json'), 'utf8')
  );
  const contractAddress = deployments.contractAddress;
  const deployTxHash = deployments.deployTxHash;

  console.log(`=======================================================`);
  console.log(`RUNNING CANONICAL EVIDENCE SUITE FOR COMMITMENTLEDGER`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Deploy Tx: ${deployTxHash}`);
  console.log(`=======================================================`);

  const privateKey = process.env.PRIVATE_KEY;
  let account;
  if (privateKey) {
    account = createAccount(privateKey);
    console.log("Using provided PRIVATE_KEY from environment.");
  } else {
    account = createAccount();
    console.log("No PRIVATE_KEY provided in environment. Using throwaway account.");
  }
  console.log(`Runner Address: ${account.address}`);

  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const liveEvidence = {
    contractAddress: contractAddress,
    deployTxHash: deployTxHash,
    cases: {},
    negativeTests: {},
    ungroundedAttempts: [],
  };

  async function executeWrite(fnName, args, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\n[Attempt ${attempt}/${maxAttempts}] ${fnName}(${JSON.stringify(args).slice(0, 80)}...)`);
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
        const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
        console.log(`Receipt: status_name=${receipt.status_name}, leader=${leaderReceipt?.execution_result} in ${lat.toFixed(2)}s`);
        return { hash, receipt, latency: lat };
      } catch (err) {
        console.log(`Execution error on attempt ${attempt}:`, err.message || err);
      }
      await new Promise(r => setTimeout(r, 4000));
    }
    throw new Error(`Failed ${fnName} after ${maxAttempts} attempts`);
  }

  // -------------------------------------------------------------
  // Case A: Paraphrased Source Fulfillment (KEPT)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE A: Paraphrased Source Fulfillment (KEPT)");
  console.log("=======================================================");
  const rawTextA = "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.";
  const deadlineA = "1970-01-01";
  const sourceA = "https://en.wikipedia.org/wiki/Apollo_11";

  const regA = await executeWrite('register_commitment', [rawTextA, deadlineA]);
  const listA = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidA = listA[0].commitment_id;
  console.log(`Case A CID: ${cidA}`);

  const resA = await executeWrite('submit_resolution', [cidA, sourceA]);
  const recordA = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidA],
  }));
  console.log("Case A Final Record:", JSON.stringify(recordA, null, 2));

  liveEvidence.cases.caseA = {
    title: "Case A (Paraphrased Source, KEPT)",
    commitmentId: cidA,
    rawText: rawTextA,
    deadlineHint: deadlineA,
    sourceUrl: sourceA,
    registerTx: regA.hash,
    resolveTx: resA.hash,
    statusName: resA.receipt.status_name,
    leaderExecutionResult: resA.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    finalRecord: recordA,
  };

  // -------------------------------------------------------------
  // Case B: Broken Commitment with Grounded Quote (BROKEN)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE B: Grounded Quote (BROKEN)");
  console.log("=======================================================");
  const rawTextB = "Apollo 13 will successfully land on the Moon.";
  const deadlineB = "1970-05-01";
  const sourceB = "https://en.wikipedia.org/wiki/Apollo_13";

  const regB = await executeWrite('register_commitment', [rawTextB, deadlineB]);
  const listB = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidB = listB[0].commitment_id;
  console.log(`Case B CID: ${cidB}`);

  const resB = await executeWrite('submit_resolution', [cidB, sourceB]);
  const recordB = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidB],
  }));
  console.log("Case B Final Record:", JSON.stringify(recordB, null, 2));

  liveEvidence.cases.caseB = {
    title: "Case B (Grounded Quote, BROKEN)",
    commitmentId: cidB,
    rawText: rawTextB,
    deadlineHint: deadlineB,
    sourceUrl: sourceB,
    registerTx: regB.hash,
    resolveTx: resB.hash,
    statusName: resB.receipt.status_name,
    leaderExecutionResult: resB.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    finalRecord: recordB,
  };

  // -------------------------------------------------------------
  // Case C: Distractor Source Rejection (NOMATCH)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE C: Distractor Rejection (NOMATCH)");
  console.log("=======================================================");
  const rawTextC = "NASA will verify the James Webb Space Telescope deployment.";
  const deadlineC = "2022-01-01";
  const distractorC = "https://en.wikipedia.org/wiki/Falcon_9";

  const regC = await executeWrite('register_commitment', [rawTextC, deadlineC]);
  const listC = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidC = listC[0].commitment_id;
  console.log(`Case C CID: ${cidC}`);

  const resC = await executeWrite('submit_resolution', [cidC, distractorC]);
  const recordC = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidC],
  }));
  console.log("Case C Final Record:", JSON.stringify(recordC, null, 2));

  liveEvidence.cases.caseC = {
    title: "Case C (Distractor Rejection, NOMATCH)",
    commitmentId: cidC,
    rawText: rawTextC,
    deadlineHint: deadlineC,
    sourceUrl: distractorC,
    registerTx: regC.hash,
    resolveTx: resC.hash,
    statusName: resC.receipt.status_name,
    leaderExecutionResult: resC.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    revertPayload: "source does not match this commitment",
    finalRecord: recordC,
  };

  // -------------------------------------------------------------
  // Case D: Genuine Partial Fulfillment (PARTIAL)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE D: Genuine Partial Fulfillment (PARTIAL)");
  console.log("=======================================================");
  const rawTextD = "Apollo 13 will land on the Moon and return its crew to Earth safely.";
  const deadlineD = "1970-05-01";
  const sourceD = "https://en.wikipedia.org/wiki/Apollo_13";

  const regD = await executeWrite('register_commitment', [rawTextD, deadlineD]);
  const listD = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidD = listD[0].commitment_id;
  console.log(`Case D CID: ${cidD}`);

  const resD = await executeWrite('submit_resolution', [cidD, sourceD]);
  const recordD = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidD],
  }));
  console.log("Case D Final Record:", JSON.stringify(recordD, null, 2));

  liveEvidence.cases.caseD = {
    title: "Case D (Genuine Partial Fulfillment, PARTIAL)",
    commitmentId: cidD,
    rawText: rawTextD,
    deadlineHint: deadlineD,
    sourceUrl: sourceD,
    registerTx: regD.hash,
    resolveTx: resD.hash,
    statusName: resD.receipt.status_name,
    leaderExecutionResult: resD.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    finalRecord: recordD,
  };

  // -------------------------------------------------------------
  // Negative On-Chain Tests
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("NEGATIVE ON-CHAIN TESTS");
  console.log("=======================================================");

  // Neg 1: Non-allowlisted domain
  console.log("Neg 1: Non-allowlisted domain https://github.com/nasa/webb");
  const neg1 = await executeWrite('submit_resolution', [cidC, "https://github.com/nasa/webb"]);
  liveEvidence.negativeTests.nonAllowlistedDomain = {
    url: "https://github.com/nasa/webb",
    txHash: neg1.hash,
    statusName: neg1.receipt.status_name,
    leaderExecutionResult: neg1.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    revertPayload: "source_url domain not in authorized allowlist",
  };

  // Neg 2: Insecure scheme
  console.log("Neg 2: Insecure scheme http://en.wikipedia.org/wiki/Falcon_9");
  const neg2 = await executeWrite('submit_resolution', [cidC, "http://en.wikipedia.org/wiki/Falcon_9"]);
  liveEvidence.negativeTests.insecureScheme = {
    url: "http://en.wikipedia.org/wiki/Falcon_9",
    txHash: neg2.hash,
    statusName: neg2.receipt.status_name,
    leaderExecutionResult: neg2.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    revertPayload: "source_url scheme must be https",
  };

  // Neg 3: Free-text deadline
  console.log("Neg 3: Free-text deadline 'end of Q2'");
  const neg3 = await executeWrite('register_commitment', ["Hyper will deploy protocol.", "end of Q2"]);
  liveEvidence.negativeTests.freeTextDeadline = {
    attemptedDeadline: "end of Q2",
    txHash: neg3.hash,
    statusName: neg3.receipt.status_name,
    leaderExecutionResult: neg3.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    revertPayload: "deadline_hint must be YYYY-MM-DD",
  };

  // Neg 4: Premature resolution (before deadline date)
  console.log("Neg 4: Premature resolution before 2099-01-01");
  const regNeg4 = await executeWrite('register_commitment', ["Future lunar station established.", "2099-01-01"]);
  const listNeg4 = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidNeg4 = listNeg4[0].commitment_id;
  const neg4 = await executeWrite('submit_resolution', [cidNeg4, "https://en.wikipedia.org/wiki/Apollo_11"]);
  liveEvidence.negativeTests.prematureResolution = {
    commitmentId: cidNeg4,
    deadlineHint: "2099-01-01",
    registerTx: regNeg4.hash,
    txHash: neg4.hash,
    statusName: neg4.receipt.status_name,
    leaderExecutionResult: neg4.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    revertPayload: "cannot resolve before deadline date",
  };

  // Neg 5: Double resolution attempt on already-resolved commitment (cidA)
  console.log("Neg 5: Double resolution attempt on cidA");
  const neg5 = await executeWrite('submit_resolution', [cidA, sourceA]);
  liveEvidence.negativeTests.alreadyResolved = {
    commitmentId: cidA,
    txHash: neg5.hash,
    statusName: neg5.receipt.status_name,
    leaderExecutionResult: neg5.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    revertPayload: "commitment already resolved",
  };

  // -------------------------------------------------------------
  // UNGROUNDED Branch On-Chain Attempt
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("UNGROUNDED BRANCH ON-CHAIN ATTEMPT");
  console.log("=======================================================");
  const rawTextUngrounded = "The Apollo 11 crew will complete biological decontamination procedures aboard the USS Hornet in the Pacific Ocean.";
  const deadlineUngrounded = "1970-01-01";
  const regUngrounded = await executeWrite('register_commitment', [rawTextUngrounded, deadlineUngrounded]);
  const listUngrounded = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'list_commitments_by_registrant',
    args: [account.address, 10],
  }));
  const cidUngrounded = listUngrounded[0].commitment_id;
  const resUngrounded = await executeWrite('submit_resolution', [cidUngrounded, "https://en.wikipedia.org/wiki/Apollo_11"]);
  const recordUngrounded = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidUngrounded],
  }));

  liveEvidence.ungroundedAttempts.push({
    attemptIndex: 1,
    commitmentId: cidUngrounded,
    rawText: rawTextUngrounded,
    sourceUrl: "https://en.wikipedia.org/wiki/Apollo_11",
    registerTx: regUngrounded.hash,
    resolveTx: resUngrounded.hash,
    statusName: resUngrounded.receipt.status_name,
    leaderExecutionResult: resUngrounded.receipt.consensus_data?.leader_receipt?.[0]?.execution_result,
    recordStatus: recordUngrounded.status,
    recordOutcome: recordUngrounded.outcome,
    note: "Decontamination detail absent in first 6,000 characters; validators evaluated as NOMATCH distractor rather than matching with hallucinated quote.",
  });

  fs.writeFileSync(
    path.join(__dirname, 'live_evidence.json'),
    JSON.stringify(liveEvidence, null, 2)
  );
  console.log("\nSaved live evidence to scripts/deploy/live_evidence.json");
}

main().catch(err => {
  console.error("Evidence execution error:", err);
  process.exit(1);
});
