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
      id: "part1",
      rawText: "Apollo 13 will land on the Moon and return its crew to Earth safely.",
      deadline: "1970-05-01",
      url: "https://en.wikipedia.org/wiki/Apollo_13",
      rationale: "Landing failed/aborted, but crew was safely returned to Earth (partial fulfillment)."
    },
    {
      id: "part2",
      rawText: "The Apollo 11 lunar mission will land humans on the Moon and complete all lunar exploration objectives.",
      deadline: "1970-01-01",
      url: "https://en.wikipedia.org/wiki/Apollo_11",
      rationale: "Humans landed on the Moon, but subsequent extravehicular exploration activities were limited in duration."
    },
    {
      id: "part3",
      rawText: "Apollo 13 astronauts will complete their lunar landing mission objectives.",
      deadline: "1970-05-01",
      url: "https://en.wikipedia.org/wiki/Apollo_13",
      rationale: "Mission aborted en route; lunar landing was not achieved while rescue was accomplished."
    }
  ];

  const results = [];

  for (let i = 0; i < candidates.length; i++) {
    const cand = candidates[i];
    console.log(`\n======================================================`);
    console.log(`Attempt ${i + 1}/3: ${cand.id}`);
    console.log(`Text: "${cand.rawText}"`);
    console.log(`URL: ${cand.url}`);
    console.log(`======================================================`);

    // 1. Register
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

    // 2. Resolve
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
    if (leaderReceipt?.result) {
      const buf = Buffer.from(leaderReceipt.result, 'base64');
      revertPayload = buf.slice(1).toString('utf8');
    }

    const finalRecord = JSON.parse(await client.readContract({
      address: contractAddress,
      functionName: 'get_commitment',
      args: [cid],
    }));
    console.log(`Final Record status: ${finalRecord.status}, outcome: ${finalRecord.outcome}, quote: "${finalRecord.resolution_quote}"`);

    results.push({
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
      resolutionQuote: finalRecord.resolution_quote,
      finalRecord: finalRecord,
    });

    if (finalRecord.status === 'RESOLVED' && finalRecord.outcome === 'PARTIAL') {
      console.log(`SUCCESS! Found genuine PARTIAL with grounded quote on Attempt ${i + 1}`);
      break;
    }
  }

  fs.writeFileSync(
    path.join(__dirname, 'partial_attempts_output.json'),
    JSON.stringify(results, null, 2)
  );
  console.log("\nSaved results to partial_attempts_output.json");
}

main().catch(console.error);
