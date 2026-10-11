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
  console.log(`Target Contract Address: ${contractAddress}`);

  const candidates = [
    {
      id: "ungrounded_attempt_2",
      rawText: "NASA will publish the complete budget expenditure records for the entire Apollo space exploration program by 1973.",
      deadline: "1973-12-31",
      url: "https://en.wikipedia.org/wiki/Apollo_11",
    },
    {
      id: "ungrounded_attempt_3",
      rawText: "The Apollo 11 crew will complete biological decontamination procedures aboard the USS Hornet in the Pacific Ocean.",
      deadline: "1970-01-01",
      url: "https://en.wikipedia.org/wiki/Apollo_11",
    }
  ];

  const results = [];

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    console.log(`\n======================================================`);
    console.log(`Testing: ${cand.id}`);
    console.log(`Text: "${cand.rawText}"`);
    console.log(`======================================================`);

    const account = createAccount();
    const client = createClient({
      chain: chains.studionet,
      account: account,
    });
    console.log(`Caller: ${account.address}`);

    const regHash = await client.writeContract({
      address: contractAddress,
      functionName: 'register_commitment',
      args: [cand.rawText, cand.deadline],
    });
    console.log(`Register Tx: ${regHash}`);
    const regReceipt = await client.waitForTransactionReceipt({
      hash: regHash,
      retries: 120,
      interval: 3000,
    });
    console.log(`Register status: ${regReceipt.status_name}, result: ${regReceipt.result_name}`);

    if (regReceipt.status_name !== 'ACCEPTED') {
      console.log(`Registration not accepted (${regReceipt.status_name}). Skipping.`);
      results.push({
        cand: cand.id,
        registerTx: regHash,
        statusName: regReceipt.status_name,
        resultName: regReceipt.result_name,
      });
      continue;
    }

    const list = JSON.parse(await client.readContract({
      address: contractAddress,
      functionName: 'list_commitments_by_registrant',
      args: [account.address, 10],
    }));
    const cid = list[0].commitment_id;
    console.log(`Registered CID: ${cid}`);

    const resHash = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_resolution',
      args: [cid, cand.url],
    });
    console.log(`Resolve Tx: ${resHash}`);
    const resReceipt = await client.waitForTransactionReceipt({
      hash: resHash,
      retries: 120,
      interval: 3000,
    });
    const leaderReceipt = resReceipt.consensus_data?.leader_receipt?.[0];
    console.log(`Resolve status: ${resReceipt.status_name}, leader: ${leaderReceipt?.execution_result}`);

    let revertPayload = null;
    const leaderReceipts = resReceipt.consensus_data?.leader_receipt || [];
    for (const lr of leaderReceipts) {
      if (typeof lr.result === 'string') {
        const buf = Buffer.from(lr.result, 'base64');
        revertPayload = buf.slice(1).toString('utf8');
        break;
      }
    }
    console.log(`Decoded revert payload: "${revertPayload}"`);

    const finalRecord = JSON.parse(await client.readContract({
      address: contractAddress,
      functionName: 'get_commitment',
      args: [cid],
    }));
    console.log(`Final Record: status=${finalRecord.status}, outcome=${finalRecord.outcome}`);

    results.push({
      cand: cand.id,
      commitmentId: cid,
      rawText: cand.rawText,
      deadline: cand.deadline,
      sourceUrl: cand.url,
      registerTx: regHash,
      resolveTx: resHash,
      statusName: resReceipt.status_name,
      leaderExecutionResult: leaderReceipt?.execution_result,
      revertPayload: revertPayload,
      recordStatus: finalRecord.status,
      recordOutcome: finalRecord.outcome,
      finalRecord: finalRecord,
    });
  }

  fs.writeFileSync(
    path.join(__dirname, 'ungrounded_fresh_output.json'),
    JSON.stringify(results, null, 2)
  );
  console.log("\nSaved to ungrounded_fresh_output.json");
}

main().catch(console.error);
