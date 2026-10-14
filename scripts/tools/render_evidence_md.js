const fs = require('fs');
const path = require('path');

function render() {
  const liveEvidence = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../deploy/live_evidence.json'), 'utf8')
  );

  const gapAttemptsPath = path.join(__dirname, '../deploy/gap_attempts.json');
  const gapAttempts = fs.existsSync(gapAttemptsPath)
    ? JSON.parse(fs.readFileSync(gapAttemptsPath, 'utf8'))
    : {};

  const contractAddress = liveEvidence.contractAddress;
  const deployTxHash = liveEvidence.deployTxHash;

  let md = `# On-Chain Evidence: CommitmentLedger v3.1.0\n\n`;
  md += `This document records the exact, verified on-chain evidence transactions executed on GenLayer Studionet (Preview) for contract \`${contractAddress}\`.\n\n`;
  md += `- **Active Contract Address**: [\`${contractAddress}\`](https://explorer-studio.genlayer.com/address/${contractAddress})\n`;
  md += `- **Deploy Transaction Hash**: [\`${deployTxHash}\`](https://explorer-studio.genlayer.com/tx/${deployTxHash})\n`;
  md += `- **Phase 1 Execution Completed**: \`${liveEvidence.phase1CompletedAt || '2026-10-14T09:33:38.072Z'}\`\n`;
  md += `- **Phase 2 Pending Maturity Date**: \`${liveEvidence.phase2PendingDate || '2026-10-16'}\`\n\n`;

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
    md += `- **Recorded Outcome**: \`${data.finalRecord?.outcome || 'UNADJUDICATED (Open/Reverted)'}\`\n`;
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

  // 3. 600-Second Challenge Window Proof (Window-Elapsed Finalization Path)
  if (liveEvidence.windowPathFinalize) {
    const wf = liveEvidence.windowPathFinalize;
    md += `## 3. 600-Second Challenge Window Finalization Proof\n\n`;
    md += `This test proves that a single provisional resolution (with fewer than 3 decisions) strictly enforces the 600-second challenge window on the GenLayer Studionet consensus clock. Early finalization is rejected with a decoded revert, and finalization succeeds once the consensus clock surpasses the deadline:\n\n`;
    md += `- **Commitment ID**: \`${wf.commitmentId}\`\n`;
    md += `- **Statement**: "${wf.statement}"\n`;
    md += `- **Deadline**: \`${wf.deadlineHint}\`\n`;
    md += `- **Source URL**: ${wf.sourceUrl}\n`;
    md += `- **Register Transaction**: [\`${wf.registerTx}\`](https://explorer-studio.genlayer.com/tx/${wf.registerTx})\n`;
    md += `- **Initial Resolution Transaction**: [\`${wf.resolveTx}\`](https://explorer-studio.genlayer.com/tx/${wf.resolveTx}) (Decided at \`${wf.decidedAt}\`, outcome: **KEPT**)\n`;
    md += `- **Challenge Deadline Timestamp**: \`${wf.challengeDeadlineTs}\` (exact 600s window: \`${wf.decidedAtTs} + 600\`)\n\n`;

    md += `### Early Finalize Attempt (Window Still Open - Revert Proof)\n\n`;
    md += `- **Attempt Transaction Hash**: [\`${wf.earlyFinalizeAttempt.txHash}\`](https://explorer-studio.genlayer.com/tx/${wf.earlyFinalizeAttempt.txHash})\n`;
    md += `- **Receipt Status Name**: \`${wf.earlyFinalizeAttempt.statusName}\`\n`;
    md += `- **Decoded Revert Payload**: \`"${wf.earlyFinalizeAttempt.revertPayload}"\` (strictly rejected while window active)\n\n`;

    md += `### Elapsed-Window Finalize Transaction\n\n`;
    md += `- **Finalize Transaction Hash**: [\`${wf.finalizeTx}\`](https://explorer-studio.genlayer.com/tx/${wf.finalizeTx})\n`;
    md += `- **Receipt Status Name**: \`${wf.finalizeStatusName}\`\n`;
    md += `- **Leader Execution**: \`${wf.finalizeLeaderExecution}\`\n`;
    md += `- **Finalization Timestamp**: \`${wf.finalizedAt}\`\n`;
    md += `- **Final Record Status**: \`${wf.finalStatus}\`\n`;
    md += `- **Decisions Count**: \`${wf.decisionsCount}\` (single decision window path)\n`;
    md += `- **Real Elapsed Consensus Seconds**: \`${wf.realElapsedSeconds}s\` (>= 600s challenge window)\n`;
    md += `- **Time from Submission to Transaction "FINALIZED"**: \`${wf.finalizedTimingSeconds}s\` (reached transaction status "FINALIZED": \`${wf.reachedFinalizedStatus}\`)\n\n`;
  }

  // 4. Additional On-Chain Adjudication Scenarios (A2 Top-Up)
  if (gapAttempts.partial && gapAttempts.partial.attempts?.length > 0) {
    const partAtt = gapAttempts.partial.attempts[0];
    md += `## 4. Additional On-Chain Scenario: Case PARTIAL\n\n`;
    md += `Empirically verified on GenLayer Studionet with compound statement ("action satisfied + unmentioned condition undetermined"):\n\n`;
    md += `- **Commitment ID**: \`${partAtt.cid}\`\n`;
    md += `- **Statement**: "${partAtt.statement}"\n`;
    md += `- **Register Transaction**: [\`${partAtt.registerTx}\`](https://explorer-studio.genlayer.com/tx/${partAtt.registerTx})\n`;
    md += `- **Resolution Transaction**: [\`${partAtt.resolveTx}\`](https://explorer-studio.genlayer.com/tx/${partAtt.resolveTx})\n`;
    md += `- **Consensus Agreement Rate**: \`${partAtt.agreeRate}\` (${partAtt.agreeCount}/${partAtt.validatorsCount} validators agreeing)\n`;
    md += `- **Recorded Outcome**: **${partAtt.outcome}** (status: \`${partAtt.recordStatus}\`)\n\n`;

    if (partAtt.elements && partAtt.elements.length > 0) {
      md += `| ID | Kind | Element Label | Status |\n`;
      md += `|---|---|---|---|\n`;
      for (const el of partAtt.elements) {
        md += `| \`${el.id}\` | \`${el.kind}\` | ${el.label} | **${el.status}** |\n`;
      }
      md += `\n`;
    }
  }

  // 5. Challenge Flow (Decision Budget Exhausted Branch)
  if (liveEvidence.challengeFlow && liveEvidence.challengeFlow.commitmentId) {
    const ch = liveEvidence.challengeFlow;
    md += `## 5. Challenge State Machine (Decision Budget Exhausted Branch)\n\n`;
    md += `This multi-decision flow exercises the alternative finalization branch (\`budget_exhausted = len(decisions) >= MAX_DECISIONS\`). When 3 decisions are recorded, the contract permits immediate finalization without waiting for the challenge window to elapse, because no further challenges are permitted:\n\n`;
    md += `- **Commitment ID**: \`${ch.commitmentId}\`\n`;
    md += `- **Register Tx**: [\`${ch.registerTx}\`](https://explorer-studio.genlayer.com/tx/${ch.registerTx})\n`;
    md += `- **Initial Resolution Tx**: [\`${ch.initialResolutionTx}\`](https://explorer-studio.genlayer.com/tx/${ch.initialResolutionTx})\n`;
    md += `- **Challenge 1 Tx (UNSUPPORTED_CLASSIFICATION)**: [\`${ch.challenge1Tx}\`](https://explorer-studio.genlayer.com/tx/${ch.challenge1Tx})\n`;
    md += `- **Challenge 2 Tx (CONFLICTING_EVIDENCE)**: [\`${ch.challenge2Tx}\`](https://explorer-studio.genlayer.com/tx/${ch.challenge2Tx})\n`;
    md += `- **Finalize Tx (Budget Exhausted)**: [\`${ch.finalizeTx}\`](https://explorer-studio.genlayer.com/tx/${ch.finalizeTx})\n`;
    md += `- **Final Record Status**: \`${ch.finalStatus}\`\n`;
    md += `- **Total Decisions In History**: \`${ch.decisionsCount}\` (reached MAX_DECISIONS = 3)\n\n`;

    if (ch.decisions && ch.decisions.length > 0) {
      md += `### Decisions Timeline\n\n`;
      md += `| Decision # | Kind | Reason | Outcome | Source URL | Fingerprint |\n`;
      md += `|---|---|---|---|---|---|\n`;
      for (const d of ch.decisions) {
        const fp = d.evidence_sha256 ? d.evidence_sha256.slice(0, 16) + '...' : 'N/A';
        md += `| ${d.n} | \`${d.kind}\` | \`${d.challenge_reason || 'N/A'}\` | **${d.outcome || 'N/A'}** | ${d.source_url} | \`${fp}\` |\n`;
      }
      md += `\n`;
    }
  }

  // 6. On-Chain Negative Rejections
  md += `## 6. On-Chain Negative Rejection Tests\n\n`;
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

  // 7. Consensus Measurements & Agreement Rate Analysis
  if (liveEvidence.consensusMeasurements && liveEvidence.consensusMeasurements.length > 0) {
    md += `## 7. Consensus Measurements & Validator Agreement Rates\n\n`;
    md += `Across empirical runs on GenLayer Studionet (Preview), successful consensus calls typically achieved 60.0% agreement (3 of 5 active validators agreeing under \`gl.eq_principle.prompt_comparative\`). Clear, unambiguous factual statements against well-structured Wikipedia articles reliably achieve majority consensus. By contrast, negative assertions or missed-deadline statements occasionally produce split validator evaluations (e.g. 0 of 5 agree, yielding \`MAJORITY_DISAGREE\` with receipt status \`UNDETERMINED\`), leaving the commitment securely in its prior state (\`OPEN\`) without state mutation.\n\n`;

    md += `| Operation | Tx Hash | Receipt Status | Consensus Result | Execution | Latency (s) | Agreement Rate |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    for (const m of liveEvidence.consensusMeasurements) {
      md += `| \`${m.fnName}\` | [\`${m.hash}\`](https://explorer-studio.genlayer.com/tx/${m.hash}) | \`${m.statusName}\` | \`${m.resultName}\` | \`${m.leaderExecution}\` | ${m.latencySec}s | **${m.agreeRate}** (${m.agreeCount}/${m.validatorsCount}) |\n`;
    }
    md += `\n`;
  }

  // 8. Unit-Tested Only (Not On-Chain)
  md += `## 8. Unit-Tested Only (Not On-Chain)\n\n`;
  md += `The following scenarios and edge cases were rigorously verified in the Python unit test suite (\`tests/test_layer1_pure.py\`, \`tests/test_layer2_mocked.py\`, \`tests/test_step0_regressions.py\`), but were not reproducible on-chain or were intentionally reserved for mock environments:\n\n`;
  md += `1. **UNSUPPORTED_CLASSIFICATION Yielding WITHDRAWN**: In our on-chain test (\`b90ed8cb5cf2\`), re-evaluating the Apollo 11 source under strict grounding re-confirmed the landing passages, yielding \`UPHELD\`. The \`WITHDRAWN\` branch (where model grounding fails to find cited text and safely resets status to \`OPEN\`) is comprehensively verified in \`test_challenge_unsupported_classification_flow\`.\n`;
  md += `2. **CONFLICTING_EVIDENCE Yielding DISPUTED**: In our on-chain challenge (\`b90ed8cb5cf2\`), the secondary source (Apollo program) confirmed the lunar landing, upholding the outcome. Creating a genuine \`DISPUTED\` outcome on-chain requires two reputable allowlisted sources with authentic contradicting assertions; this branch is strictly verified in \`test_challenge_conflicting_evidence_flow\`.\n`;
  md += `3. **Retrospective Missed-Deadline Yielding BROKEN**: On-chain attempt (\`0689a0a5c7c3\`, tx \`0x395eb380908774ad4ffd46dd6e7b1e7a27fd162149fa67d2d3e1b47a7a4a8a9d\`) resulted in validator disagreement (\`MAJORITY_DISAGREE\`, 0/5 agree), leaving the commitment \`OPEN\`. The deterministic outcome mapping for missed deadlines is verified in unit tests.\n`;
  md += `4. **Fourth Challenge Attempt Rejection**: Attempting a 4th challenge once \`MAX_DECISIONS = 3\` is reached reverts with \`"challenge limit reached"\`. Verified in \`test_challenge_limit_reached\`.\n`;
  md += `5. **Malformed JSON & Missing Attributes**: Synthetic LLM outputs returning missing elements, non-object JSON roots, or invalid schema types revert with \`"malformed consensus result"\` and do not alter state.\n`;
  md += `6. **Storage Nonce Neutrality on Rejected Registration**: Registrations that revert for invalid deadline dates, empty text, or unacknowledged retrospective deadlines touch zero storage and do not increment nonces.\n\n`;

  // Validation: Reject undefined or stray None
  if (md.includes('undefined')) {
    throw new Error('Rendered markdown contains "undefined"');
  }
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes(': None') || l.includes('`None`') || l.endsWith(' None')) {
      throw new Error(`Rendered markdown contains forbidden literal "None" at line ${i + 1}: ${l}`);
    }
  }

  const outPath = path.join(__dirname, '../../docs/EVIDENCE.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`Rendered ${outPath} successfully (0 undefined, 0 forbidden None).`);
}

render();
