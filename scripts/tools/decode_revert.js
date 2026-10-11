const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const fs = require('fs');
const path = require('path');

async function main() {
  const hash = process.argv[2];
  if (!hash) {
    console.error("Usage: node scripts/tools/decode_revert.js <tx_hash>");
    process.exit(1);
  }

  const rpcUrl = "https://studio.genlayer.com/api";
  const res = await fetch(rpcUrl, {
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
  const tx = json.result;
  if (!tx) {
    console.error("Transaction not found or empty response:", json);
    process.exit(1);
  }

  console.log(`Transaction Hash: ${hash}`);
  console.log(`Status Name: ${tx.status_name}`);
  console.log(`Consensus Result Name: ${tx.result_name}`);

  const leaderReceipts = tx.consensus_data?.leader_receipt || [];
  const leader0 = leaderReceipts[0];
  console.log(`Leader Execution Result: ${leader0?.execution_result}`);

  let decodedPayload = null;
  for (const lr of leaderReceipts) {
    if (typeof lr.result === 'string') {
      const buf = Buffer.from(lr.result, 'base64');
      decodedPayload = buf.slice(1).toString('utf8');
      break;
    }
  }

  console.log(`Decoded Revert Payload: ${decodedPayload ? `"${decodedPayload}"` : "none"}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
