const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains } = require('genlayer-js');
const fs = require('fs');
const path = require('path');

async function main() {
  const cid = process.argv[2];
  if (!cid) {
    console.error("Usage: node scripts/tools/read_commitment.js <commitment_id>");
    process.exit(1);
  }

  const deployments = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../deploy/deployments.json'), 'utf8')
  );
  const contractAddress = deployments.contractAddress;

  const client = createClient({
    chain: chains.studionet,
  });

  const recordStr = await client.readContract({
    address: contractAddress,
    functionName: 'get_commitment',
    args: [cid],
  });

  const record = JSON.parse(recordStr);
  console.log(JSON.stringify(record, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
