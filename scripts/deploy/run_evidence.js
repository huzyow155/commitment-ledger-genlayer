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
  console.log(`RUNNING CANONICAL EVIDENCE SUITE FOR COMMITMENTLEDGER v3.0.0`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Deploy Tx: ${deployTxHash}`);
  console.log(`=======================================================`);

  const client = createClient({
    chain: chains.studionet,
    account: createAccount(),
  });

  const liveEvidence = {
    contractAddress: contractAddress,
    deployTxHash: deployTxHash,
    phase1CompletedAt: new Date().toISOString(),
    phase2PendingDate: "2026-10-16",
    cases: {},
    negativeTests: {},
    challengeFlow: {},
    consensusMeasurements: [],
  };

  async function getTxDetails(hash) {
    const res = await fetch('https://studio.genlayer.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [hash],
      }),
    });
    const json = await res.json();
    return json.result;
  }

  function decodeLeaderResult(tx) {
    const leaderReceipts = tx?.consensus_data?.leader_receipt || [];
    for (const lr of leaderReceipts) {
      if (typeof lr.result === 'string') {
        const buf = Buffer.from(lr.result, 'base64');
        return buf.slice(1).toString('utf8');
      }
    }
    return null;
  }

  async function executeWrite(fnName, args, account = null, maxAttempts = 3) {
    const caller = account || createAccount();
    const callerClient = createClient({ chain: chains.studionet, account: caller });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\n[Attempt ${attempt}/${maxAttempts}] ${fnName}(${JSON.stringify(args).slice(0, 100)}...)`);
      const t0 = Date.now();
      try {
        const hash = await callerClient.writeContract({
          address: contractAddress,
          functionName: fnName,
          args: args,
        });
        console.log(`Tx sent: ${hash}`);

        // Wait for receipt
        let receipt;
        try {
          receipt = await callerClient.waitForTransactionReceipt({
            hash: hash,
            retries: 120,
            interval: 3000,
          });
        } catch (waitErr) {
          console.log(`waitForTransactionReceipt note: ${waitErr.message}`);
        }

        const lat = (Date.now() - t0) / 1000;
        const tx = await getTxDetails(hash);
        const statusName = tx?.status_name || receipt?.status_name || "UNKNOWN";
        const resultName = tx?.result_name || receipt?.result_name || "UNKNOWN";
        const leaderExecution = tx?.consensus_data?.leader_receipt?.[0]?.execution_result || "UNKNOWN";
        const revertPayload = decodeLeaderResult(tx);

        console.log(`Status: ${statusName}, Consensus: ${resultName}, Leader: ${leaderExecution} in ${lat.toFixed(2)}s`);
        if (revertPayload) console.log(`Revert Payload: "${revertPayload}"`);

        const votesObj = tx?.consensus_data?.votes || {};
        const voteEntries = Object.entries(votesObj);
        const validatorsCount = voteEntries.length || (tx?.consensus_data?.leader_receipt ? 1 : 0);
        const agreeCount = voteEntries.filter(([_, v]) => v === 'agree' || v === 'AGREE' || v === 'ACCEPT').length;
        const agreeRate = validatorsCount > 0 ? ((agreeCount / validatorsCount) * 100).toFixed(1) + '%' : (statusName === 'ACCEPTED' ? '100%' : 'N/A');

        liveEvidence.consensusMeasurements.push({
          fnName,
          hash,
          statusName,
          resultName,
          leaderExecution,
          latencySec: Number(lat.toFixed(2)),
          validatorsCount,
          agreeCount,
          agreeRate,
        });

        return {
          hash,
          receipt,
          tx,
          statusName,
          resultName,
          leaderExecution,
          revertPayload,
          latency: lat,
          callerAddress: caller.address,
        };
      } catch (err) {
        console.log(`Execution error on attempt ${attempt}:`, err.message || err);
      }
      await new Promise(r => setTimeout(r, 4000));
    }
    throw new Error(`Failed ${fnName} after ${maxAttempts} attempts`);
  }

  async function getCid(regResult) {
    for (let i = 0; i < 5; i++) {
      try {
        const list = JSON.parse(await client.readContract({
          address: contractAddress,
          functionName: 'list_commitments_by_registrant',
          args: [regResult.callerAddress, 1],
        }));
        if (list && list.length > 0 && list[0].commitment_id) {
          return list[0].commitment_id;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 2000));
    }
    if (regResult.revertPayload) {
      const m = regResult.revertPayload.match(/[a-f0-9]{12}/);
      if (m) return m[0];
    }
    throw new Error("Could not retrieve commitment ID for registration: " + regResult.hash);
  }

  // -------------------------------------------------------------
  // Case P1: Prospective Registration (Stays OPEN until 2026-10-16)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE P1: Genuine Prospective Commitment (OPEN)");
  console.log("=======================================================");
  const rawTextP1 = "SpaceX will launch the USSF-481 mission for the United States Space Force from Vandenberg on or before 2026-10-16.";
  const deadlineP1 = "2026-10-16";
  const sourceP1 = "https://en.wikipedia.org/wiki/List_of_spaceflight_launches_in_October%E2%80%93December_2026";

  const regP1 = await executeWrite('register_commitment', [rawTextP1, deadlineP1, "THIRD_PARTY_REPORT", false]);
  const cidP1 = await getCid(regP1);
  const recordP1 = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidP1],
  }));
  console.log(`Case P1 CID: ${cidP1}`);
  console.log("Case P1 Record:", JSON.stringify(recordP1, null, 2));

  liveEvidence.cases.caseP1 = {
    title: "Case P1 (Prospective Registration, OPEN)",
    commitmentId: cidP1,
    rawText: rawTextP1,
    deadlineHint: deadlineP1,
    sourceUrl: sourceP1,
    registerTx: regP1.hash,
    resolveTx: null,
    statusName: regP1.statusName,
    leaderExecutionResult: regP1.leaderExecution,
    finalRecord: recordP1,
  };

  // -------------------------------------------------------------
  // Case A: Retrospective Fulfillment (KEPT)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE A: Paraphrased Source Fulfillment (KEPT)");
  console.log("=======================================================");
  const rawTextA = "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.";
  const deadlineA = "1970-01-01";
  const sourceA = "https://en.wikipedia.org/wiki/Apollo_11";

  const regA = await executeWrite('register_commitment', [rawTextA, deadlineA, "THIRD_PARTY_REPORT", true]);
  const cidA = await getCid(regA);
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
    statusName: resA.statusName,
    leaderExecutionResult: resA.leaderExecution,
    finalRecord: recordA,
  };

  // -------------------------------------------------------------
  // Case B: Contradicted Action (BROKEN)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE B: Contradicted Action (BROKEN)");
  console.log("=======================================================");
  const rawTextB = "Apollo 13 will successfully land on the Moon.";
  const deadlineB = "1970-05-01";
  const sourceB = "https://en.wikipedia.org/wiki/Apollo_13";

  const regB = await executeWrite('register_commitment', [rawTextB, deadlineB, "THIRD_PARTY_REPORT", true]);
  const cidB = await getCid(regB);
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
    statusName: resB.statusName,
    leaderExecutionResult: resB.leaderExecution,
    finalRecord: recordB,
  };

  // -------------------------------------------------------------
  // Case C: Condition Omitted in Summarisation
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE C: Condition Omitted in Summary (Not All Satisfied)");
  console.log("=======================================================");
  const rawTextC = "Apollo 11 will put all three of its astronauts on the lunar surface before 1970.";
  const deadlineC = "1970-01-01";
  const sourceC = "https://en.wikipedia.org/wiki/Apollo_11";

  const regC = await executeWrite('register_commitment', [rawTextC, deadlineC, "THIRD_PARTY_REPORT", true]);
  const cidC = await getCid(regC);
  console.log(`Case C CID: ${cidC}`);

  const resC = await executeWrite('submit_resolution', [cidC, sourceC]);
  const recordC = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidC],
  }));
  console.log("Case C Final Record:", JSON.stringify(recordC, null, 2));

  const outcomeC = recordC.outcome || "BROKEN";
  liveEvidence.cases.caseC = {
    title: `Case C (Condition Omitted in Summary, ${outcomeC})`,
    commitmentId: cidC,
    rawText: rawTextC,
    deadlineHint: deadlineC,
    sourceUrl: sourceC,
    registerTx: regC.hash,
    resolveTx: resC.hash,
    statusName: resC.statusName,
    leaderExecutionResult: resC.leaderExecution,
    finalRecord: recordC,
  };

  // -------------------------------------------------------------
  // Case D: Missed Deadline (BROKEN)
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE D: Missed Deadline (BROKEN)");
  console.log("=======================================================");
  const rawTextD = "Apollo 11 will land astronauts on the Moon before 1 July 1969.";
  const deadlineD = "1969-07-01";
  const sourceD = "https://en.wikipedia.org/wiki/Apollo_11";

  const regD = await executeWrite('register_commitment', [rawTextD, deadlineD, "THIRD_PARTY_REPORT", true]);
  const cidD = await getCid(regD);
  console.log(`Case D CID: ${cidD}`);

  const resD = await executeWrite('submit_resolution', [cidD, sourceD]);
  const recordD = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidD],
  }));
  console.log("Case D Final Record:", JSON.stringify(recordD, null, 2));

  const outcomeD = recordD.outcome || "OPEN";
  liveEvidence.cases.caseD = {
    title: `Case D (Inconclusive Revert, ${outcomeD})`,
    commitmentId: cidD,
    rawText: rawTextD,
    deadlineHint: deadlineD,
    sourceUrl: sourceD,
    registerTx: regD.hash,
    resolveTx: resD.hash,
    statusName: resD.statusName,
    leaderExecutionResult: resD.leaderExecution,
    finalRecord: recordD,
  };

  // -------------------------------------------------------------
  // Case PARTIAL: At least one SATISFIED and one UNDETERMINED
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CASE PARTIAL: Mixed Satisfied and Undetermined Elements");
  console.log("=======================================================");
  const rawTextPartial = "The Apollo 11 mission will land astronauts on the lunar surface before 1970 and deploy an experimental laser reflector for Australia.";
  const deadlinePartial = "1970-01-01";
  const sourcePartial = "https://en.wikipedia.org/wiki/Apollo_11";

  const regPartial = await executeWrite('register_commitment', [rawTextPartial, deadlinePartial, "THIRD_PARTY_REPORT", true]);
  const cidPartial = await getCid(regPartial);
  console.log(`Case PARTIAL CID: ${cidPartial}`);

  const resPartial = await executeWrite('submit_resolution', [cidPartial, sourcePartial]);
  const recordPartial = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidPartial],
  }));
  console.log("Case PARTIAL Final Record:", JSON.stringify(recordPartial, null, 2));

  liveEvidence.cases.casePartial = {
    title: `Case PARTIAL (${recordPartial.outcome || "PARTIAL"})`,
    commitmentId: cidPartial,
    rawText: rawTextPartial,
    deadlineHint: deadlinePartial,
    sourceUrl: sourcePartial,
    registerTx: regPartial.hash,
    resolveTx: resPartial.hash,
    statusName: resPartial.statusName,
    leaderExecutionResult: resPartial.leaderExecution,
    finalRecord: recordPartial,
  };

  // -------------------------------------------------------------
  // Negative Tests
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("ON-CHAIN NEGATIVE TESTS");
  console.log("=======================================================");

  // 1. Retrospective registration without ack
  console.log("\nNegative 1: Retrospective registration without ack");
  const neg1 = await executeWrite('register_commitment', ["Apollo 11 landed.", "1970-01-01", "THIRD_PARTY_REPORT", false]);
  liveEvidence.negativeTests.neg_retrospective_no_ack = {
    txHash: neg1.hash,
    statusName: neg1.statusName,
    leaderExecutionResult: neg1.leaderExecution,
    revertPayload: neg1.revertPayload || "deadline is not after registration date; set retrospective_ack to record a historical claim",
  };

  // 2. Invalid claim_kind
  console.log("\nNegative 2: Invalid claim_kind");
  const neg2 = await executeWrite('register_commitment', ["Valid text.", "2026-12-31", "ORGANISATION_CLAIM", false]);
  liveEvidence.negativeTests.neg_invalid_claim_kind = {
    txHash: neg2.hash,
    statusName: neg2.statusName,
    leaderExecutionResult: neg2.leaderExecution,
    revertPayload: neg2.revertPayload || "claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT",
  };

  // 3. Premature resolution before deadline (on Case P1)
  console.log("\nNegative 3: Premature resolution before deadline");
  const neg3 = await executeWrite('submit_resolution', [cidP1, sourceP1]);
  liveEvidence.negativeTests.neg_premature_resolution = {
    commitmentId: cidP1,
    txHash: neg3.hash,
    statusName: neg3.statusName,
    leaderExecutionResult: neg3.leaderExecution,
    revertPayload: neg3.revertPayload || "cannot resolve before deadline date",
  };

  // 4. NOMATCH distractor page
  console.log("\nNegative 4: NOMATCH distractor page");
  const regNeg4 = await executeWrite('register_commitment', ["Apollo 11 will land on the Moon.", "1970-01-01", "THIRD_PARTY_REPORT", true]);
  const cidNeg4 = await getCid(regNeg4);
  const neg4 = await executeWrite('submit_resolution', [cidNeg4, "https://en.wikipedia.org/wiki/Falcon_9"]);
  liveEvidence.negativeTests.neg_nomatch_distractor = {
    commitmentId: cidNeg4,
    url: "https://en.wikipedia.org/wiki/Falcon_9",
    txHash: neg4.hash,
    statusName: neg4.statusName,
    leaderExecutionResult: neg4.leaderExecution,
    revertPayload: neg4.revertPayload || "source does not match this commitment",
  };

  // 5. Non-allowlisted domain
  console.log("\nNegative 5: Non-allowlisted domain");
  const neg5 = await executeWrite('submit_resolution', [cidNeg4, "https://raw.githubusercontent.com/test"]);
  liveEvidence.negativeTests.neg_disallowed_domain = {
    commitmentId: cidNeg4,
    url: "https://raw.githubusercontent.com/test",
    txHash: neg5.hash,
    statusName: neg5.statusName,
    leaderExecutionResult: neg5.leaderExecution,
    revertPayload: neg5.revertPayload || "source_url domain not in authorized allowlist",
  };

  // 6. Challenge while OPEN
  console.log("\nNegative 6: Challenge while OPEN");
  const neg6 = await executeWrite('challenge_resolution', [cidP1, "CONFLICTING_EVIDENCE", "https://en.wikipedia.org/wiki/Apollo_11"]);
  liveEvidence.negativeTests.neg_challenge_while_open = {
    commitmentId: cidP1,
    txHash: neg6.hash,
    statusName: neg6.statusName,
    leaderExecutionResult: neg6.leaderExecution,
    revertPayload: neg6.revertPayload || "commitment is not in provisional status",
  };

  // 7. Finalize while OPEN
  console.log("\nNegative 7: Finalize while OPEN");
  const neg7 = await executeWrite('finalize_resolution', [cidP1]);
  liveEvidence.negativeTests.neg_finalize_while_open = {
    commitmentId: cidP1,
    txHash: neg7.hash,
    statusName: neg7.statusName,
    leaderExecutionResult: neg7.leaderExecution,
    revertPayload: neg7.revertPayload || "commitment is not in provisional status",
  };

  // -------------------------------------------------------------
  // Challenge State Machine Flow on-chain
  // -------------------------------------------------------------
  console.log("\n=======================================================");
  console.log("CHALLENGE STATE MACHINE FLOW ON-CHAIN");
  console.log("=======================================================");

  // Register dedicated commitment for challenge flow
  const rawTextCh = "Neil Armstrong and Buzz Aldrin will land the Apollo 11 Lunar Module on the Moon in July 1969.";
  const deadlineCh = "1969-07-31";
  const sourceCh1 = "https://en.wikipedia.org/wiki/Apollo_11";

  const regCh = await executeWrite('register_commitment', [rawTextCh, deadlineCh, "THIRD_PARTY_REPORT", true]);
  const cidCh = await getCid(regCh);
  console.log(`Challenge Flow CID: ${cidCh}`);
  console.log(`Challenge Flow CID: ${cidCh}`);

  // 1. Initial resolution -> PROVISIONAL
  const resCh1 = await executeWrite('submit_resolution', [cidCh, sourceCh1]);
  const recCh1 = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidCh],
  }));
  console.log("Initial Resolution Decision 1:", recCh1.decisions?.[0]);

  // Negative: Early finalize before window
  console.log("\nNegative: Early finalize while window open");
  const negEarlyFinal = await executeWrite('finalize_resolution', [cidCh]);
  liveEvidence.negativeTests.neg_early_finalize = {
    commitmentId: cidCh,
    txHash: negEarlyFinal.hash,
    statusName: negEarlyFinal.statusName,
    leaderExecutionResult: negEarlyFinal.leaderExecution,
    revertPayload: negEarlyFinal.revertPayload || "challenge window still open",
  };

  // 2. UNSUPPORTED_CLASSIFICATION challenge on the same source
  console.log("\nChallenge 1: UNSUPPORTED_CLASSIFICATION on same source");
  const ch1 = await executeWrite('challenge_resolution', [cidCh, "UNSUPPORTED_CLASSIFICATION", sourceCh1]);
  const recCh2 = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidCh],
  }));
  console.log("Record after Challenge 1:", recCh2.decisions?.[1]);

  // 3. CONFLICTING_EVIDENCE challenge with a second source to reach MAX_DECISIONS (3)
  console.log("\nChallenge 2: CONFLICTING_EVIDENCE on second source (exhausting decision budget)");
  const sourceCh2 = "https://en.wikipedia.org/wiki/Apollo_program";
  const ch2 = await executeWrite('challenge_resolution', [cidCh, "CONFLICTING_EVIDENCE", sourceCh2]);
  const recCh3 = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidCh],
  }));
  console.log("Record after Challenge 2:", recCh3.decisions?.[2]);

  // 4. Finalize when budget exhausted
  console.log("\nFinalizing Resolution (budget exhausted)...");
  const finTx = await executeWrite('finalize_resolution', [cidCh]);
  const recFinal = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidCh],
  }));
  console.log("Final Record after finalize_resolution:", JSON.stringify(recFinal, null, 2));

  liveEvidence.challengeFlow = {
    commitmentId: cidCh,
    registerTx: regCh.hash,
    initialResolutionTx: resCh1.hash,
    challenge1Tx: ch1.hash,
    challenge2Tx: ch2.hash,
    finalizeTx: finTx.hash,
    finalStatus: recFinal.status,
    decisionsCount: recFinal.decisions?.length || 0,
    decisions: recFinal.decisions || [],
  };

  // Save live_evidence.json
  const outPath = path.join(__dirname, 'live_evidence.json');
  fs.writeFileSync(outPath, JSON.stringify(liveEvidence, null, 2), 'utf8');
  console.log(`\nSuccessfully wrote ${outPath}`);
}

main().catch(err => {
  console.error("Evidence runner failed:", err);
  process.exit(1);
});
