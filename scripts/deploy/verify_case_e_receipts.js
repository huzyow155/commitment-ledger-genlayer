const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const hashes = [
  "0xeaad301f9936810d9444853dee124a17e5cde35f616bbf45df5154dc891d7bbe",
  "0x222552175590d4c492115f0a853fd0181da2cd355b49a63707a1e8e90a45106c"
];

async function main() {
  const rpcUrl = "https://studio.genlayer.com/api";
  for (const h of hashes) {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [h],
      }),
    });
    const json = await res.json();
    console.log(`\nTx: ${h}`);
    console.log(`status_name: ${json.result?.status_name}`);
    console.log(`result_name: ${json.result?.result_name}`);
    const leaderReceipt = json.result?.consensus_data?.leader_receipt?.[0];
    console.log(`leader execution_result: ${leaderReceipt?.execution_result}`);
  }
}

main().catch(console.error);
