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

  const account = createAccount();
  console.log(`Caller: ${account.address}`);
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const candidates = [
    {
      id: "ungrounded1",
      rawText: "The Apollo 11 lunar module will lift off from the lunar surface on July 21 1969.",
      deadline: "1970-01-01",
      url: "https://en.wikipedia.org/wiki/Apollo_11",
      rationale: "The exact liftoff details and return rendezvous occur deep in the article, beyond the 6,000 character truncation bound, which will cause the model to synthesize a quote from memory not verbatim in the truncated text."
    },
    {
      id: "ungrounded2",
      rawText: "NASA Apollo program total financial expenditure reached over twenty billion dollars by 1973.",
      deadline: "1975-01-01",
      url: "https://en.wikipedia.org/wiki/Apollo_11",
      rationale: "Budgetary summary across the program is discussed in broader historical context later in the article or summarized conceptually, tempting a paraphrase."
    },
    {
      id: "ungrounded3",
      rawText: "The Apollo 11 crew will undergo extensive quarantine protocols upon oceanic recovery in the Pacific.",
      deadline: "1970-01-01",
      url: "https://en.wikipedia.org/wiki/Apollo_11",
      rationale: "Post-mission quarantine protocols are detailed far beyond 6,000 characters."
    }
  ];

  const attempts = [];

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    console.log(`\n======================================================`);
    console.log(`Ungrounded Attempt ${i + 1}/3: ${cand.id}`);
    console.log(`Text: "${cand.rawText}"`);
    console.log(`URL: ${cand.url}`);
    console.log(`======================================================`);

    const regHash = await client.writeContract({
      address: contractAddress,
      functionName: 'register_commitment',
      args: [cand.rawText, cand.deadline],
    });
    console.log(`Register Tx sent: ${regHash}`);
    const regReceipt = await client.waitForTransactionReceipt({
      hash: regHash,
      retries: 120,
      interval: 3000,
    });
    console.log(`Register receipt: status=${regReceipt.status_name}, result=${regReceipt.result_name}`);

    const list = JSON.parse(await client.readContract({
      address: contractAddress,
      functionName: 'list_commitments_by_registrant',
      args: [account.address, 10],
    }));
    const cid = list[0].commitment_id;
    console.log(`Registered CID: ${cid}, subject="${list[0].subject}", action="${list[0].action}"`);

    const resHash = await client.writeContract({
      address: contractAddress,
      functionName: 'submit_resolution',
      args: [cid, cand.url],
    });
    console.log(`Resolve Tx sent: ${resHash}`);
    const resReceipt = await client.waitForTransactionReceipt({
      hash: resHash,
      retries: 120,
      interval: 3000,
    });
    const leaderReceipt = resReceipt.consensus_data?.leader_receipt?.[0];
    console.log(`Resolve receipt: status=${resReceipt.status_name}, leader=${leaderReceipt?.execution_result}`);

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

    attempts.push({
      attemptIndex: i + 1,
      id: cand.id,
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

    if (leaderReceipt?.execution_result === 'ERROR' && revertPayload === 'no grounded quote in source') {
      console.log(`SUCCESS! Triggered on-chain UNGROUNDED branch on Attempt ${i + 1}`);
      break;
    }
  }

  fs.writeFileSync(
    path.join(__dirname, 'ungrounded_attempts_output.json'),
    JSON.stringify(attempts, null, 2)
  );
  console.log("\nSaved results to ungrounded_attempts_output.json");
}

main().catch(console.error);
