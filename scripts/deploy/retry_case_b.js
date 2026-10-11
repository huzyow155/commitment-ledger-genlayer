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
  console.log(`Contract: ${contractAddress}`);

  const account = createAccount();
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const cidB = "8957209fbf0c";
  const sourceB = "https://en.wikipedia.org/wiki/Apollo_13";

  console.log("Resolving Case B (Apollo 13)...");
  const hash = await client.writeContract({
    address: contractAddress,
    functionName: 'submit_resolution',
    args: [cidB, sourceB],
  });
  console.log(`Tx sent: ${hash}`);

  const receipt = await client.waitForTransactionReceipt({
    hash: hash,
    retries: 120,
    interval: 3000,
  });
  console.log(`Receipt: status_name=${receipt.status_name}, result_name=${receipt.result_name}, leader=${receipt.consensus_data?.leader_receipt?.[0]?.execution_result}`);

  const recordB = JSON.parse(await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cidB],
  }));
  console.log("Record B:", JSON.stringify(recordB, null, 2));

  // Update live_evidence.json if successful
  const liveEvidence = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'live_evidence.json'), 'utf8')
  );
  liveEvidence.cases.caseB.resolveTx = hash;
  liveEvidence.cases.caseB.statusName = receipt.status_name;
  liveEvidence.cases.caseB.leaderExecutionResult = receipt.consensus_data?.leader_receipt?.[0]?.execution_result;
  liveEvidence.cases.caseB.finalRecord = recordB;

  fs.writeFileSync(
    path.join(__dirname, 'live_evidence.json'),
    JSON.stringify(liveEvidence, null, 2)
  );
  console.log("Updated live_evidence.json with Case B");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
