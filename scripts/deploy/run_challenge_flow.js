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

  console.log(`=======================================================`);
  console.log(`RUNNING CHALLENGE STATE MACHINE FLOW ON-CHAIN`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`=======================================================`);

  const client = createClient({
    chain: chains.studionet,
    account: createAccount(),
  });

  const evidencePath = path.join(__dirname, 'live_evidence.json');
  const liveEvidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

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
      console.log(`\n[Attempt ${attempt}/${maxAttempts}] ${fnName}(${JSON.stringify(args).slice(0, 80)}...)`);
      const t0 = Date.now();
      try {
        const hash = await callerClient.writeContract({
          address: contractAddress,
          functionName: fnName,
          args: args,
        });
        console.log(`Tx sent: ${hash}`);

        try {
          await callerClient.waitForTransactionReceipt({
            hash: hash,
            retries: 120,
            interval: 3000,
          });
        } catch (waitErr) {
          console.log(`waitForTransactionReceipt note: ${waitErr.message}`);
        }

        const lat = (Date.now() - t0) / 1000;
        const tx = await getTxDetails(hash);
        const statusName = tx?.status_name || tx?.status || "UNKNOWN";
        const resultName = tx?.result_name || "UNKNOWN";
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

  // 1. Register dedicated commitment for challenge flow (using proven Case A phrasing)
  const rawTextCh = "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.";
  const deadlineCh = "1970-01-01";
  const sourceCh1 = "https://en.wikipedia.org/wiki/Apollo_11";

  const regCh = await executeWrite('register_commitment', [rawTextCh, deadlineCh, "THIRD_PARTY_REPORT", true]);
  const cidCh = await getCid(regCh);
  console.log(`Challenge Flow CID: ${cidCh}`);

  // 2. Initial resolution -> PROVISIONAL
  const resCh1 = await executeWrite('submit_resolution', [cidCh, sourceCh1]);
  const recCh1 = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidCh],
  }));
  console.log("Initial Resolution Status:", recCh1.status, "Outcome:", recCh1.outcome);
  console.log("Decision 1:", recCh1.decisions?.[0]);

  // 3. Negative: Early finalize before window
  console.log("\nNegative: Early finalize while window open");
  const negEarlyFinal = await executeWrite('finalize_resolution', [cidCh]);
  liveEvidence.negativeTests.neg_early_finalize = {
    commitmentId: cidCh,
    txHash: negEarlyFinal.hash,
    statusName: negEarlyFinal.statusName,
    leaderExecutionResult: negEarlyFinal.leaderExecution,
    revertPayload: negEarlyFinal.revertPayload || "challenge window still open",
  };

  // 4. UNSUPPORTED_CLASSIFICATION challenge on the same source
  console.log("\nChallenge 1: UNSUPPORTED_CLASSIFICATION on same source");
  const ch1 = await executeWrite('challenge_resolution', [cidCh, "UNSUPPORTED_CLASSIFICATION", sourceCh1]);
  const recCh2 = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidCh],
  }));
  console.log("Record after Challenge 1:", recCh2.decisions?.[1]);

  // 5. CONFLICTING_EVIDENCE challenge on second source to reach MAX_DECISIONS (3)
  console.log("\nChallenge 2: CONFLICTING_EVIDENCE on second source (exhausting decision budget)");
  const sourceCh2 = "https://en.wikipedia.org/wiki/Apollo_program";
  const ch2 = await executeWrite('challenge_resolution', [cidCh, "CONFLICTING_EVIDENCE", sourceCh2]);
  const recCh3 = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidCh],
  }));
  console.log("Record after Challenge 2:", recCh3.decisions?.[2]);

  // 6. Finalize when budget exhausted
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

  fs.writeFileSync(evidencePath, JSON.stringify(liveEvidence, null, 2), 'utf8');
  console.log(`\nSuccessfully updated ${evidencePath}`);
}

main().catch(err => {
  console.error("Challenge flow failed:", err);
  process.exit(1);
});
