const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const hashes = [
  "0x647de249785999396d2587e9895ebe310865ab46e08a3bff527f0fb36d9d0ca2",
  "0x27a4f5321825bfda60058e91ce194d6d40047782acdb027acdf7201768abaceb"
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
    const leaderReceipts = json.result?.consensus_data?.leader_receipt || [];
    let payload = null;
    for (const lr of leaderReceipts) {
      if (typeof lr.result === 'string') {
        const buf = Buffer.from(lr.result, 'base64');
        payload = buf.slice(1).toString('utf8');
        break;
      }
    }
    console.log(`Hash: ${h} -> result: "${payload}"`);
  }
}

main().catch(console.error);
