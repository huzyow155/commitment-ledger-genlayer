const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

const deployments = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'deployments.json'), 'utf8')
);
const contractAddress = deployments.contractAddress;
const stateFile = path.join(__dirname, 'window_flow_state.json');
const evidencePath = path.join(__dirname, 'live_evidence.json');

const client = createClient({
  chain: chains.studionet,
  account: createAccount(),
});

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

async function getChainTimestamp() {
  const res = await fetch('https://studio.genlayer.com/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    }),
  });
  const json = await res.json();
  if (json.result && json.result.timestamp) {
    return parseInt(json.result.timestamp, 16);
  }
  throw new Error('Failed to fetch chain timestamp');
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
      const statusName = tx?.status_name || tx?.status || 'UNKNOWN';
      const resultName = tx?.result_name || 'UNKNOWN';
      const leaderExecution = tx?.consensus_data?.leader_receipt?.[0]?.execution_result || 'UNKNOWN';
      const revertPayload = decodeLeaderResult(tx);

      console.log(`Status: ${statusName}, Consensus: ${resultName}, Leader: ${leaderExecution} in ${lat.toFixed(2)}s`);
      if (revertPayload) console.log(`Revert/Return Payload: "${revertPayload}"`);

      const votesObj = tx?.consensus_data?.votes || {};
      const voteEntries = Object.entries(votesObj);
      const validatorsCount = voteEntries.length || (tx?.consensus_data?.leader_receipt ? 1 : 0);
      const agreeCount = voteEntries.filter(([_, v]) => v === 'agree' || v === 'AGREE' || v === 'ACCEPT').length;
      const agreeRate = validatorsCount > 0 ? ((agreeCount / validatorsCount) * 100).toFixed(1) + '%' : (statusName === 'ACCEPTED' ? '100%' : 'N/A');

      return {
        hash,
        tx,
        statusName,
        resultName,
        leaderExecution,
        revertPayload,
        latency: lat,
        callerAddress: caller.address,
        validatorsCount,
        agreeCount,
        agreeRate,
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
  throw new Error('Could not retrieve commitment ID for registration: ' + regResult.hash);
}

async function pollUntilFinalized(hash, maxWaitSec = 180) {
  console.log(`Polling tx ${hash} for 'FINALIZED' status...`);
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < maxWaitSec) {
    const tx = await getTxDetails(hash);
    const rawStatus = tx?.status;
    const statusName = tx?.status_name;
    const current = rawStatus || statusName;
    if (current === 'FINALIZED' || rawStatus === 'FINALIZED') {
      const elapsed = (Date.now() - t0) / 1000;
      console.log(`Reached 'FINALIZED' in ${elapsed.toFixed(2)}s`);
      return { isFinal: true, elapsedSeconds: elapsed, finalStatus: current };
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  const total = (Date.now() - t0) / 1000;
  console.log(`Did not reach 'FINALIZED' within ${total.toFixed(2)}s (status remains: ${current})`);
  return { isFinal: false, elapsedSeconds: total, finalStatus: current };
}

async function main() {
  const cmd = process.argv[2] || 'status';

  if (cmd === 'init') {
    console.log('=== STEP 1: INITIALIZE WINDOW-PATH COMMITMENT & RESOLUTION ===');
    const statement = 'The Apollo 11 lunar module landed on the Moon in July 1969.';
    const deadline = '1970-01-01';
    const source = 'https://en.wikipedia.org/wiki/Apollo_11';

    console.log(`Registering commitment...`);
    const regResult = await executeWrite('register_commitment', [statement, deadline, 'THIRD_PARTY_REPORT', true]);
    const cid = await getCid(regResult);
    console.log(`Registered CID: ${cid}`);

    console.log(`Submitting initial resolution...`);
    const resResult = await executeWrite('submit_resolution', [cid, source]);

    const rec = JSON.parse(await client.readContract({
      address: contractAddress,
      functionName: 'get_commitment',
      args: [cid],
    }));

    console.log(`Commitment Status: ${rec.status}, Outcome: ${rec.outcome}`);
    console.log(`Challenge Deadline TS: ${rec.challenge_deadline_ts} (${new Date(rec.challenge_deadline_ts * 1000).toISOString()})`);
    console.log(`Decision 1 Decided At: ${rec.decisions?.[0]?.decided_at} (TS: ${rec.decisions?.[0]?.decided_at_ts})`);

    // Negative attempt: finalize immediately while window is still open
    console.log(`\nAttempting early finalize immediately (must revert)...`);
    const earlyFinalizeResult = await executeWrite('finalize_resolution', [cid]);
    console.log(`Early finalize statusName: ${earlyFinalizeResult.statusName}, Leader execution: ${earlyFinalizeResult.leaderExecution}`);
    console.log(`Revert payload: "${earlyFinalizeResult.revertPayload}"`);

    const chainTs = await getChainTimestamp();
    const state = {
      cid,
      statement,
      deadline,
      source,
      registerTx: regResult.hash,
      resolveTx: resResult.hash,
      earlyFinalizeTx: earlyFinalizeResult.hash,
      earlyFinalizeRevert: earlyFinalizeResult.revertPayload || 'challenge window still open',
      earlyFinalizeStatus: earlyFinalizeResult.statusName,
      decidedAtTs: rec.decisions?.[0]?.decided_at_ts,
      decidedAt: rec.decisions?.[0]?.decided_at,
      challengeDeadlineTs: rec.challenge_deadline_ts,
      initialOutcome: rec.outcome,
      elements: rec.decisions?.[0]?.elements || [],
      initChainTs: chainTs,
      initLocalTime: new Date().toISOString(),
    };

    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
    console.log(`\nSaved window flow state to ${stateFile}`);
    console.log(`Current Chain Timestamp: ${chainTs} (${new Date(chainTs * 1000).toISOString()})`);
    console.log(`Target Deadline: ${state.challengeDeadlineTs} (${new Date(state.challengeDeadlineTs * 1000).toISOString()})`);
    console.log(`Remaining chain seconds: ${state.challengeDeadlineTs - chainTs}s`);
  } else if (cmd === 'status') {
    if (!fs.existsSync(stateFile)) {
      console.log('No window flow state file found. Run "node run_window_flow.js init" first.');
      return;
    }
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const chainTs = await getChainTimestamp();
    const remaining = state.challengeDeadlineTs - chainTs;

    console.log(`CID: ${state.cid}`);
    console.log(`Current Chain Timestamp: ${chainTs} (${new Date(chainTs * 1000).toISOString()})`);
    console.log(`Target Challenge Deadline: ${state.challengeDeadlineTs} (${new Date(state.challengeDeadlineTs * 1000).toISOString()})`);
    console.log(`Remaining Chain Seconds: ${remaining}s`);

    const rec = JSON.parse(await client.readContract({
      address: contractAddress,
      functionName: 'get_commitment',
      args: [state.cid],
    }));
    console.log(`Current Status: ${rec.status}, Decisions count: ${rec.decisions?.length}`);

    if (remaining <= 0) {
      console.log('>>> Challenge window has ELAPSED on chain clock! Ready to finalize.');
    } else {
      console.log(`>>> Still open: ${remaining}s remaining.`);
    }
  } else if (cmd === 'finalize') {
    if (!fs.existsSync(stateFile)) {
      console.log('No window flow state file found. Run "node run_window_flow.js init" first.');
      return;
    }
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const chainTs = await getChainTimestamp();
    const remaining = state.challengeDeadlineTs - chainTs;

    if (remaining > 0) {
      console.log(`Cannot finalize yet! Chain clock has ${remaining}s remaining until ${state.challengeDeadlineTs}.`);
      return;
    }

    console.log(`=== EXECUTING FINALIZATION ON ELAPSED CHALLENGE WINDOW ===`);
    console.log(`CID: ${state.cid}`);
    console.log(`Chain Clock: ${chainTs} >= Deadline: ${state.challengeDeadlineTs}`);

    const tSubmit = Date.now();
    const finResult = await executeWrite('finalize_resolution', [state.cid]);
    const finalizeLatency = (Date.now() - tSubmit) / 1000;

    // Check 'FINALIZED' timing
    console.log(`Measuring 'FINALIZED' timing on tx ${finResult.hash}...`);
    const finalizedTiming = await pollUntilFinalized(finResult.hash, 180);

    const recFinal = JSON.parse(await client.readContract({
      address: contractAddress,
      functionName: 'get_commitment',
      args: [state.cid],
    }));

    console.log('\nFinal Record:', JSON.stringify(recFinal, null, 2));

    const realElapsedSeconds = Math.max(0, chainTs - state.decidedAtTs);
    console.log(`Real elapsed chain seconds between resolution and finalize: ${realElapsedSeconds}s (Window = 600s)`);

    state.finalizeTx = finResult.hash;
    state.finalizeStatusName = finResult.statusName;
    state.finalizeLeaderExecution = finResult.leaderExecution;
    state.finalizedAt = recFinal.finalized_at;
    state.finalStatus = recFinal.status;
    state.finalDecisionsCount = recFinal.decisions?.length || 1;
    state.realElapsedSeconds = realElapsedSeconds;
    state.finalizedTiming = finalizedTiming;
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');

    // Update live_evidence.json
    const liveEvidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    liveEvidence.windowPathFinalize = {
      commitmentId: state.cid,
      statement: state.statement,
      deadlineHint: state.deadline,
      sourceUrl: state.source,
      registerTx: state.registerTx,
      resolveTx: state.resolveTx,
      decidedAt: state.decidedAt,
      decidedAtTs: state.decidedAtTs,
      challengeDeadlineTs: state.challengeDeadlineTs,
      earlyFinalizeAttempt: {
        txHash: state.earlyFinalizeTx,
        statusName: state.earlyFinalizeStatus,
        revertPayload: state.earlyFinalizeRevert,
      },
      finalizeTx: state.finalizeTx,
      finalizeStatusName: state.finalizeStatusName,
      finalizeLeaderExecution: state.finalizeLeaderExecution,
      finalizedAt: state.finalizedAt,
      finalStatus: state.finalStatus,
      decisionsCount: state.finalDecisionsCount,
      realElapsedSeconds: realElapsedSeconds,
      finalizedTimingSeconds: finalizedTiming.elapsedSeconds,
      reachedFinalizedStatus: finalizedTiming.isFinal,
    };

    fs.writeFileSync(evidencePath, JSON.stringify(liveEvidence, null, 2), 'utf8');
    console.log(`\nUpdated ${evidencePath} with windowPathFinalize evidence!`);
  }
}

main().catch(err => {
  console.error('Window flow error:', err);
  process.exit(1);
});
