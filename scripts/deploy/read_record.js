const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'deployments.json'), 'utf8')
  );
  const client = createClient({
    chain: chains.studionet,
  });

  const cid = "a7ff11e6c969";
  const record = JSON.parse(await client.readContract({
    address: deployments.contractAddress,
    functionName: 'get_commitment',
    args: [cid],
  }));
  console.log("Record for", cid, ":", JSON.stringify(record, null, 2));
}

main().catch(console.error);
