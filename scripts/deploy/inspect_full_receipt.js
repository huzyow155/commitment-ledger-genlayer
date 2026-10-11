const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

async function main() {
  const rpcUrl = "https://studio.genlayer.com/api";
  const hash = "0x3db3ee1df9f6a5355f1ffb335d21a7ea45f487c87b6ce470a393f535b1d508f7";

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
  console.log("Full json keys:", Object.keys(json.result));
  console.log("Full consensus_data keys:", Object.keys(json.result.consensus_data || {}));
  console.log("Leader receipt full:", JSON.stringify(json.result.consensus_data?.leader_receipt, null, 2));
}

main().catch(console.error);
