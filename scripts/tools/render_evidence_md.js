const fs = require('fs');
const path = require('path');

function render() {
  const liveEvidence = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../deploy/live_evidence.json'), 'utf8')
  );

  const contractAddress = liveEvidence.contractAddress;
  const deployTxHash = liveEvidence.deployTxHash;

  let md = `# On-Chain Evidence: CommitmentLedger v2.2.0\n\n`;
  md += `This document records the exact, verified on-chain evidence transactions executed on GenLayer Studionet (Preview) for contract \`${contractAddress}\`.\n\n`;
  md += `- **Active Contract Address**: [\`${contractAddress}\`](https://explorer-studio.genlayer.com/address/${contractAddress})\n`;
  md += `- **Deploy Transaction Hash**: [\`${deployTxHash}\`](https://explorer-studio.genlayer.com/tx/${deployTxHash})\n\n`;

  md += `## 1. Verified Case Resolutions\n\n`;

  const cases = liveEvidence.cases || {};
  for (const [key, data] of Object.entries(cases)) {
    md += `### ${data.title}\n\n`;
    md += `- **Commitment ID**: \`${data.commitmentId}\`\n`;
    md += `- **Raw Text**: "${data.rawText}"\n`;
    md += `- **Deadline**: \`${data.deadlineHint}\`\n`;
    md += `- **Source URL**: ${data.sourceUrl}\n`;
    md += `- **Register Transaction Hash**: [\`${data.registerTx}\`](https://explorer-studio.genlayer.com/tx/${data.registerTx})\n`;
    md += `- **Resolve Transaction Hash**: [\`${data.resolveTx}\`](https://explorer-studio.genlayer.com/tx/${data.resolveTx})\n`;
    md += `- **Receipt Status Name**: \`${data.statusName}\`\n`;
    md += `- **Leader Execution Result**: \`${data.leaderExecutionResult}\`\n`;
    md += `- **Recorded Outcome**: \`${data.finalRecord?.outcome}\`\n`;
    md += `- **Grounded Resolution Quote**: ${data.finalRecord?.resolution_quote ? `"${data.finalRecord.resolution_quote}"` : "None"}\n`;
    md += `- **Read-Back Method & Field**: \`client.readContract({ functionName: 'get_commitment', args: ['${data.commitmentId}'] })\` returning field \`outcome\`\n\n`;
    md += `\`\`\`json\n${JSON.stringify(data.finalRecord, null, 2)}\n\`\`\`\n\n`;
  }

  md += `## 2. On-Chain Negative Rejection Tests\n\n`;
  md += `Every negative test below was verified on GenLayer Studionet by querying JSON-RPC \`eth_getTransactionByHash\` and decoding base64 field \`result.consensus_data.leader_receipt[0].result\` (first byte sliced off, remainder decoded as UTF-8 string):\n\n`;

  const negTests = liveEvidence.negativeTests || {};
  for (const [key, data] of Object.entries(negTests)) {
    md += `### ${key}\n\n`;
    if (data.url) md += `- **Submitted Parameter (URL)**: \`${data.url}\`\n`;
    if (data.attemptedDeadline) md += `- **Submitted Parameter (Deadline)**: \`${data.attemptedDeadline}\`\n`;
    if (data.commitmentId) md += `- **Target Commitment ID**: \`${data.commitmentId}\`\n`;
    md += `- **Transaction Hash**: [\`${data.txHash}\`](https://explorer-studio.genlayer.com/tx/${data.txHash})\n`;
    md += `- **Receipt Status Name**: \`${data.statusName}\`\n`;
    md += `- **Leader Execution Result**: \`${data.leaderExecutionResult}\`\n`;
    md += `- **Decoded Revert Payload**: \`"${data.revertPayload}"\`\n`;
    md += `- **Decode Method**: JSON-RPC \`eth_getTransactionByHash\`, sliced base64 payload from \`consensus_data.leader_receipt[0].result\`\n\n`;
  }

  if (liveEvidence.ungroundedAttempts && liveEvidence.ungroundedAttempts.length > 0) {
    md += `## 3. UNGROUNDED / INVALID Branch Attempts\n\n`;
    for (const att of liveEvidence.ungroundedAttempts) {
      md += `- **Attempt ${att.attemptIndex}** (\`${att.commitmentId}\`): "${att.rawText}" -> ${att.sourceUrl}\n`;
      md += `  - Register: [\`${att.registerTx}\`](https://explorer-studio.genlayer.com/tx/${att.registerTx})\n`;
      md += `  - Resolve: [\`${att.resolveTx}\`](https://explorer-studio.genlayer.com/tx/${att.resolveTx})\n`;
      md += `  - Result: ${att.recordStatus} (${att.recordOutcome || att.revertPayload || "none"})\n`;
      if (att.note) md += `  - Note: ${att.note}\n`;
    }
    md += `\n`;
  }

  const outPath = path.join(__dirname, '../../docs/EVIDENCE.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`Rendered ${outPath}`);
}

render();
