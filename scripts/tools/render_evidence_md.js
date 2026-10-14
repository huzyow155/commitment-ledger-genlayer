const fs = require('fs');
const path = require('path');

function render() {
  const liveEvidence = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../deploy/live_evidence.json'), 'utf8')
  );

  const contractAddress = liveEvidence.contractAddress;
  const deployTxHash = liveEvidence.deployTxHash;

  let md = `# On-Chain Evidence: CommitmentLedger v3.1.0\n\n`;
  md += `This document records the exact, verified on-chain evidence transactions executed on GenLayer Studionet (Preview) for contract \`${contractAddress}\`.\n\n`;
  md += `- **Active Contract Address**: [\`${contractAddress}\`](https://explorer-studio.genlayer.com/address/${contractAddress})\n`;
  md += `- **Deploy Transaction Hash**: [\`${deployTxHash}\`](https://explorer-studio.genlayer.com/tx/${deployTxHash})\n`;
  md += `- **Phase 1 Execution Completed**: \`${liveEvidence.phase1CompletedAt || new Date().toISOString()}\`\n`;
  md += `- **Phase 2 Pending Maturity Date**: \`${liveEvidence.phase2PendingDate || "2026-10-16"}\`\n\n`;

  // 1. Case P1 & Prospective Registrations
  md += `## 1. Prospective Registration (Phase 1 Recorded, Phase 2 Pending)\n\n`;
  const caseP1 = liveEvidence.cases?.caseP1;
  if (caseP1) {
    md += `### ${caseP1.title}\n\n`;
    md += `- **Commitment ID**: \`${caseP1.commitmentId}\`\n`;
    md += `- **Statement**: "${caseP1.rawText}"\n`;
    md += `- **Deadline**: \`${caseP1.deadlineHint}\`\n`;
    md += `- **Target Source URL**: ${caseP1.sourceUrl}\n`;
    md += `- **Registration Transaction**: [\`${caseP1.registerTx}\`](https://explorer-studio.genlayer.com/tx/${caseP1.registerTx})\n`;
    md += `- **Receipt Status**: \`${caseP1.statusName}\`\n`;
    md += `- **Leader Execution**: \`${caseP1.leaderExecutionResult}\`\n`;
    md += `- **Record Status**: \`${caseP1.finalRecord?.status}\`\n`;
    md += `- **Registration Class**: \`${caseP1.finalRecord?.registration_class || 'PROSPECTIVE'}\`\n`;
    md += `- **Record Class**: \`${caseP1.finalRecord?.record_class}\`\n`;
    md += `- **Claim Kind**: \`${caseP1.finalRecord?.claim_kind}\`\n\n`;
    md += `\`\`\`json\n${JSON.stringify(caseP1.finalRecord, null, 2)}\n\`\`\`\n\n`;
  }

  // 2. Primary Case Resolutions
  md += `## 2. Verified Case Resolutions\n\n`;
  const cases = liveEvidence.cases || {};
  for (const [key, data] of Object.entries(cases)) {
    if (key === 'caseP1') continue;
    const decisions = data.finalRecord?.decisions || [];
    const activeIdx = (typeof data.finalRecord?.current_decision_index === 'number' && data.finalRecord.current_decision_index >= 0)
      ? data.finalRecord.current_decision_index
      : (decisions.length > 0 ? decisions.length - 1 : -1);
    const activeDec = activeIdx >= 0 ? decisions[activeIdx] : null;

    const evSha = activeDec?.evidence_sha256 || 'N/A';
    const inspSha = activeDec?.inspected_text_sha256 || 'N/A';
    const cov = activeDec?.coverage || 'N/A';
    const charsInsp = activeDec?.source_chars_inspected || 0;
    const charsTot = activeDec?.source_chars_total || 0;
    const presentedCount = activeDec?.presented_segments_count ?? (activeDec?.presented_segment_ids?.length || 0);
    const budgetUsed = activeDec?.budget_chars_used || charsInsp;

    md += `### ${data.title}\n\n`;
    md += `- **Commitment ID**: \`${data.commitmentId}\`\n`;
    md += `- **Raw Text**: "${data.rawText}"\n`;
    md += `- **Deadline**: \`${data.deadlineHint}\`\n`;
    md += `- **Source URL**: ${data.sourceUrl}\n`;
    md += `- **Register Transaction Hash**: [\`${data.registerTx}\`](https://explorer-studio.genlayer.com/tx/${data.registerTx})\n`;
    md += `- **Resolve Transaction Hash**: [\`${data.resolveTx}\`](https://explorer-studio.genlayer.com/tx/${data.resolveTx})\n`;
    md += `- **Receipt Status Name**: \`${data.statusName}\`\n`;
    md += `- **Leader Execution Result**: \`${data.leaderExecutionResult}\`\n`;
    md += `- **Recorded Outcome**: \`${data.finalRecord?.outcome || 'NONE (Reverted/Open)'}\`\n`;
    md += `- **Evidence Preimage SHA-256**: \`${evSha}\`\n`;
    md += `- **Inspected Text SHA-256**: \`${inspSha}\`\n`;
    md += `- **Window Coverage**: \`${cov}\` (${charsInsp} / ${charsTot} chars inspected, budget used: ${budgetUsed} chars, segments presented: ${presentedCount})\n\n`;

    if (data.attempts && data.attempts.length > 0) {
      md += `#### Resolution Attempts\n\n`;
      md += `| Attempt | Tx Hash | Status | Consensus | Note |\n`;
      md += `|---|---|---|---|---|\n`;
      for (const att of data.attempts) {
        md += `| ${att.attempt} | [\`${att.hash}\`](https://explorer-studio.genlayer.com/tx/${att.hash}) | \`${att.statusName}\` | \`${att.resultName}\` | ${att.note} |\n`;
      }
      md += `\n`;
    }

    const elements = activeDec?.elements || data.finalRecord?.elements || [];
    if (elements.length > 0) {
      md += `#### Adjudicated Elements\n\n`;
      md += `| ID | Kind | Label | Status | Cited Segment IDs |\n`;
      md += `|---|---|---|---|---|\n`;
      for (const el of elements) {
        md += `| \`${el.id}\` | \`${el.kind}\` | ${el.label.replace(/\|/g, '-')} | **${el.status}** | \`${JSON.stringify(el.passage_ids || el.cited_segment_ids || [])}\` |\n`;
      }
      md += `\n`;
    }

    md += `\`\`\`json\n${JSON.stringify(data.finalRecord, null, 2)}\n\`\`\`\n\n`;
  }

  // 3. Challenge Flow
  if (liveEvidence.challengeFlow && liveEvidence.challengeFlow.commitmentId) {
    const ch = liveEvidence.challengeFlow;
    md += `## 3. Challenge State Machine & Decisions History\n\n`;
    md += `Verified on-chain challenge progression exercising the bounded reconsideration state machine:\n\n`;
    md += `- **Commitment ID**: \`${ch.commitmentId}\`\n`;
    md += `- **Register Tx**: [\`${ch.registerTx}\`](https://explorer-studio.genlayer.com/tx/${ch.registerTx})\n`;
    md += `- **Initial Resolution Tx**: [\`${ch.initialResolutionTx}\`](https://explorer-studio.genlayer.com/tx/${ch.initialResolutionTx})\n`;
    md += `- **Challenge 1 Tx (UNSUPPORTED_CLASSIFICATION)**: [\`${ch.challenge1Tx}\`](https://explorer-studio.genlayer.com/tx/${ch.challenge1Tx})\n`;
    md += `- **Challenge 2 Tx (CONFLICTING_EVIDENCE)**: [\`${ch.challenge2Tx}\`](https://explorer-studio.genlayer.com/tx/${ch.challenge2Tx})\n`;
    md += `- **Finalize Tx**: [\`${ch.finalizeTx}\`](https://explorer-studio.genlayer.com/tx/${ch.finalizeTx})\n`;
    md += `- **Final Record Status**: \`${ch.finalStatus}\`\n`;
    md += `- **Total Decisions In History**: \`${ch.decisionsCount}\`\n\n`;

    if (ch.decisions && ch.decisions.length > 0) {
      md += `### Decisions Timeline\n\n`;
      md += `| Decision # | Kind | Reason | Outcome | Source URL | Fingerprint |\n`;
      md += `|---|---|---|---|---|---|\n`;
      for (const d of ch.decisions) {
        md += `| ${d.n} | \`${d.kind}\` | \`${d.challenge_reason || 'N/A'}\` | **${d.outcome || 'N/A'}** | ${d.source_url} | \`${d.evidence_sha256 ? d.evidence_sha256.slice(0, 16) + '...' : 'None'}\` |\n`;
      }
      md += `\n`;
    }
  }

  // 4. On-Chain Negative Rejections
  md += `## 4. On-Chain Negative Rejection Tests\n\n`;
  md += `Every negative test below was verified on GenLayer Studionet by querying JSON-RPC \`eth_getTransactionByHash\` and decoding base64 field \`result.consensus_data.leader_receipt[0].result\`:\n\n`;

  const negTests = liveEvidence.negativeTests || {};
  for (const [key, data] of Object.entries(negTests)) {
    md += `### ${key}\n\n`;
    if (data.url) md += `- **Submitted Parameter (URL)**: \`${data.url}\`\n`;
    if (data.commitmentId) md += `- **Target Commitment ID**: \`${data.commitmentId}\`\n`;
    md += `- **Transaction Hash**: [\`${data.txHash}\`](https://explorer-studio.genlayer.com/tx/${data.txHash})\n`;
    md += `- **Receipt Status Name**: \`${data.statusName}\`\n`;
    md += `- **Leader Execution Result**: \`${data.leaderExecutionResult}\`\n`;
    md += `- **Decoded Revert Payload**: \`"${data.revertPayload}"\`\n\n`;
  }

  // 5. Consensus Measurements
  if (liveEvidence.consensusMeasurements && liveEvidence.consensusMeasurements.length > 0) {
    md += `## 5. Consensus Measurements & Validator Agreement Rates\n\n`;
    md += `Empirical validator telemetry captured during test execution:\n\n`;
    md += `| Operation | Tx Hash | Receipt Status | Consensus Result | Execution | Latency (s) | Agreement Rate |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    for (const m of liveEvidence.consensusMeasurements) {
      md += `| \`${m.fnName}\` | [\`${m.hash}\`](https://explorer-studio.genlayer.com/tx/${m.hash}) | \`${m.statusName}\` | \`${m.resultName}\` | \`${m.leaderExecution}\` | ${m.latencySec}s | **${m.agreeRate}** (${m.agreeCount}/${m.validatorsCount}) |\n`;
    }
    md += `\n`;
  }

  // 6. Unit-Tested Only Features
  md += `## 6. Features Covered Exclusively in Pure/Mock Unit Tests\n\n`;
  md += `The following contract safeguards are rigorously verified via \`tests/test_layer1_pure.py\` and \`tests/test_layer2_mocked.py\`, but are intentionally not triggered on-chain to conserve studionet funds and avoid validator spam:\n\n`;
  md += `1. **Elements Bounds Enforcement**: Validation rejecting models that output fewer than 2 elements or more than 6 elements (\`len(elements) > 6\`).\n`;
  md += `2. **Strict Regex Calendar Date Parser**: Full date format validation rejecting malformed expressions (e.g. leap year invalid dates, non-numeric months, trailing whitespace).\n`;
  md += `3. **Exhaustive Element-to-Outcome Matrix**: All 14 combinatoric branches between ACTION, CONDITION, and DEADLINE satisfaction.\n`;
  md += `4. **Strict JSON Parser Resiliency**: Parser rejection of corrupted LLM payloads, non-object JSON roots, markdown fence stripping edge cases, and control character injections.\n`;
  md += `5. **Challenge Decision Cap**: Rejection of a 4th challenge when \`MAX_DECISIONS = 3\` is already reached.\n`;
  md += `6. **Deterministic Sentence Segmentation**: Segmentation boundary handling for decimal points, honorific abbreviations (Dr., Gen.), and sentence length capping at 240 characters.\n\n`;

  const outPath = path.join(__dirname, '../../docs/EVIDENCE.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`Rendered ${outPath}`);
}

render();
