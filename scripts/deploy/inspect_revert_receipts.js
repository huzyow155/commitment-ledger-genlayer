const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const fs = require('fs');
const path = require('path');

async function main() {
  const rpcUrl = "https://studio.genlayer.com/api";
  const hashes = {
    caseC_resolve: "0xfb42396d32522f8b143f16155e35a62233629f9da9278788d1cbbf5ee1a945a3",
    nonAllowlistedDomain: "0x3db3ee1df9f6a5355f1ffb335d21a7ea45f487c87b6ce470a393f535b1d508f7",
    insecureScheme: "0x5180df851b7bf0c6bd4af7483df445e4b1dfaf747512b4bb1ded61430f0889d2",
    freeTextDeadline: "0xee70c7ad2011db0ad86a1ec12c802e6c4556002700293ad0322c66c6772880a5",
    prematureResolution: "0x43f6587c18ae2f9b3d34c4c99ca056a9fc8b122e6c1e967ce96a51d594e42535",
    alreadyResolved: "0xb700d2e9be062c18b973dadbc5f5e97cb9cda337ebab1381ac5d20a60d43a666",
  };

  for (const [name, hash] of Object.entries(hashes)) {
    console.log(`\n========================================`);
    console.log(`Querying ${name}: ${hash}`);
    console.log(`========================================`);
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
    const result = json.result;
    if (!result) {
      console.log("No result:", json);
      continue;
    }
    const leaderReceipt = result.consensus_data?.leader_receipt?.[0];
    console.log("status_name:", result.status_name);
    console.log("leader execution_result:", leaderReceipt?.execution_result);
    console.log("genvm_result:", JSON.stringify(leaderReceipt?.genvm_result, null, 2));
    console.log("result_data / payload:", JSON.stringify(result.data, null, 2));
  }
}

main().catch(console.error);
