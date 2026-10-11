const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const hash = "0x41b93dbfa438310cae1be0a0096af3041e369e85b1099618f2ee431c344f5c23";

async function main() {
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
  const leaderReceipts = json.result?.consensus_data?.leader_receipt || [];
  console.log("status_name:", json.result?.status_name);
  console.log("result_name:", json.result?.result_name);
  console.log("Leader receipts count:", leaderReceipts.length);
  for (let i = 0; i < leaderReceipts.length; i++) {
    const lr = leaderReceipts[i];
    console.log(`\nReceipt ${i}:`);
    console.log(`  mode: ${lr.mode}, vote: ${lr.vote}`);
    console.log(`  execution_result: ${lr.execution_result}`);
    console.log(`  result raw: ${lr.result}`);
    if (lr.result) {
      const buf = Buffer.from(lr.result, 'base64');
      console.log(`  result hex: ${buf.toString('hex')}`);
      console.log(`  result text sliced(1): "${buf.slice(1).toString('utf8')}"`);
    }
    console.log(`  genvm_result:`, JSON.stringify(lr.genvm_result, null, 2));
  }
}

main().catch(console.error);
