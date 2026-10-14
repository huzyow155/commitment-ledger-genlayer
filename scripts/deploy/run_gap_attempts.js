const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

const deployments = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'deployments.json'), 'utf8')
);
const contractAddress = deployments.contractAddress;
const logPath = path.join(__dirname, 'gap_attempts.json');

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

async function executeWrite(fnName, args, account = null) {
  const caller = account || createAccount();
  const callerClient = createClient({ chain: chains.studionet, account: caller });

  console.log(`\nExecuting ${fnName}(${JSON.stringify(args).slice(0, 100)}...)`);
  const t0 = Date.now();
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
  if (revertPayload) console.log(`Payload: "${revertPayload}"`);

  const votesObj = tx?.consensus_data?.votes || {};
  const voteEntries = Object.entries(votesObj);
  const validatorsCount = voteEntries.length || (tx?.consensus_data?.leader_receipt ? 1 : 0);
  const agreeCount = voteEntries.filter(([_, v]) => v === 'agree' || v === 'AGREE' || v === 'ACCEPT').length;
  const agreeRate = validatorsCount > 0 ? ((agreeCount / validatorsCount) * 100).toFixed(1) + '%' : (statusName === 'ACCEPTED' ? '100%' : 'N/A');

  return {
    hash,
    statusName,
    resultName,
    leaderExecution,
    revertPayload,
    latency: Number(lat.toFixed(2)),
    validatorsCount,
    agreeCount,
    agreeRate,
    callerAddress: caller.address,
  };
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

async function runScenario(scenarioKey, statement, deadline, sourceUrl, isRetrospective = true) {
  let logData = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : {};
  if (!logData[scenarioKey]) logData[scenarioKey] = { attempts: [] };

  const attemptNum = logData[scenarioKey].attempts.length + 1;
  console.log(`\n=======================================================`);
  console.log(`SCENARIO ${scenarioKey} - ATTEMPT ${attemptNum}`);
  console.log(`Statement: "${statement}"`);
  console.log(`Deadline: ${deadline}, Source: ${sourceUrl}`);
  console.log(`=======================================================`);

  try {
    const regResult = await executeWrite('register_commitment', [statement, deadline, 'THIRD_PARTY_REPORT', isRetrospective]);
    const cid = await getCid(regResult);
    console.log(`Registered CID: ${cid}`);

    const resResult = await executeWrite('submit_resolution', [cid, sourceUrl]);

    let finalRecord = null;
    try {
      finalRecord = JSON.parse(await client.readContract({
        address: contractAddress,
        functionName: 'get_commitment',
        args: [cid],
      }));
    } catch (e) {
      console.log('Readback error:', e.message);
    }

    const attemptRecord = {
      attempt: attemptNum,
      cid,
      statement,
      deadline,
      sourceUrl,
      registerTx: regResult.hash,
      registerStatus: regResult.statusName,
      resolveTx: resResult.hash,
      resolveStatus: resResult.statusName,
      consensusResult: resResult.resultName,
      leaderExecution: resResult.leaderExecution,
      agreeCount: resResult.agreeCount,
      validatorsCount: resResult.validatorsCount,
      agreeRate: resResult.agreeRate,
      outcome: finalRecord?.outcome || null,
      recordStatus: finalRecord?.status || 'UNKNOWN',
      elements: finalRecord?.decisions?.[0]?.elements || [],
    };

    logData[scenarioKey].attempts.push(attemptRecord);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2), 'utf8');
    console.log(`Logged attempt ${attemptNum} to ${logPath}`);
    return attemptRecord;
  } catch (err) {
    console.error(`Attempt ${attemptNum} failed with error:`, err.message || err);
    logData[scenarioKey].attempts.push({
      attempt: attemptNum,
      statement,
      deadline,
      sourceUrl,
      error: err.message || String(err),
    });
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2), 'utf8');
  }
}

async function main() {
  const target = process.argv[2] || 'missed_deadline';
  if (target === 'missed_deadline') {
    await runScenario(
      'missed_deadline',
      'The Apollo 11 mission will land astronauts on the lunar surface before 1968-01-01.',
      '1968-01-01',
      'https://en.wikipedia.org/wiki/Apollo_11',
      true
    );
  } else if (target === 'partial') {
    await runScenario(
      'partial',
      'Apollo 11 landed astronauts on the Moon in July 1969 and the astronauts ate fresh peaches on the lunar surface.',
      '1970-01-01',
      'https://en.wikipedia.org/wiki/Apollo_11',
      true
    );
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
