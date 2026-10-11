# Prior Art Analysis: Commitment Tracking & Semantic Claim Matching

This document analyzes prior art across GenLayer and decentralized systems regarding commitment tracking, promise ledgers, and semantic claim matching.

## Landscape Overview

In decentralized applications and agentic systems, tracking commitments (promises, roadmaps, deadlines) has traditionally relied on either:
1. **Exact string or hash matching**: Storing a cryptographic digest of an agreed statement. Any textual variation, paraphrase, or slight clarification results in a completely different hash, failing match checks.
2. **Oracle / Human Attestation**: Relying on external multi-sigs, human juries (e.g. Kleros), or centralized oracles to manually interpret whether an action fulfilled a stated roadmap pledge.
3. **Optimistic Escrow / Dispute Protocols**: For example, agentic commerce frameworks (such as the COMMIT protocol conceptualization) where agents lock collateral and validators settle claims based on task specifications.

## Difference Table

| System / Approach | Mechanism | Paraphrase Handling | Outcome Classification | Trust Model |
| :--- | :--- | :--- | :--- | :--- |
| **Exact Hash / Text Registry** | Exact keccak256 or string comparison | **Fails completely**: Any rephrasing or synonym change breaks linkage. | Boolean (exact match only). | Deterministic EVM code. |
| **Human Jury (e.g., Kleros / Aragon)** | Human jurors review evidence in natural language. | **Manual**: Jurors read subjective wording. | Subjective voting by token holders. | Economic incentive game; slow (days to weeks), expensive. |
| **Agentic Promise Escrows (e.g., COMMIT)** | Collateralized agent escrows with task SLAs. | Evaluates deliverables against JSON schemas or programmatic APIs. | Pass/Fail escrow release based on task completion. | Escrow-focused; requires locked funds and financial incentives. |
| **CommitmentLedger (This Work)** | Standalone Intelligent Contract with two-phase consensus: canonical predicate extraction at registration (`subject`, `action`) + consensus semantic matching at resolution. | **Autonomous & Robust**: LLM extracts semantics; validators agree on whether evidence addresses the exact same commitment regardless of sentence structure, synonyms, or clause reordering. | Deterministic scoring (`KEPT`, `BROKEN`, `PARTIAL`) enforced with grounded verbatim quotes (>=12 chars). Non-matching evidence is strictly rejected. | Multi-validator consensus via GenLayer `strict_eq`; no funds, no tokens, pure transparent accountability. |

## Detailed Comparison Points

### 1. The Paraphrase-Dodging Vulnerability
Traditional commitment registries suffer from paraphrase vulnerability:
- A speaker pledges: *"We will ship the audited governance token staking module before the end of Q3 2026."*
- When held accountable, bad actors dodge by pointing out phrasing differences or claiming resolutions apply to different statements.
- Conversely, naive automated scrapers cannot match resolution evidence phrased as: *"In September 2026, the team successfully launched their verified staking contract following the completion of the audit."*
- `CommitmentLedger` extracts normalized canonical predicates (`subject` and `action`) upon registration. When evidence is submitted, multi-validator consensus checks whether the evidence semantically pertains to that original commitment.

### 2. Trap Defense (Superficial Similarity vs. Genuine Paraphrase)
A naive fuzzy matcher or loose semantic search might conflate:
- Original: *"Alice will deploy the cross-chain liquidity bridge by August."*
- Different action: *"Alice deployed the cross-chain NFT bridge in August."* (Superficially similar subject and timeline, but completely different action).
`CommitmentLedger` explicitly trains validators to detect non-matching actions and reject them with a `gl.vm.UserError("evidence does not match this commitment")`, leaving the commitment open.

### 3. Grounded Evidence Quote Requirement
To prevent hallucinations or unjustified confident scoring, `CommitmentLedger` enforces deterministic validation on quotes:
- Quoted text must be at least 12 characters long.
- Quoted text must exist verbatim within the submitted untrusted evidence text.
- If a quote fails grounded verification, the outcome is forced down to `PARTIAL`, never allowing an ungrounded `KEPT` or `BROKEN` verdict.

## Conclusion

No existing contract in GenLayer studionet or EVM provides a zero-fund, multi-validator consensus semantic commitment ledger that extracts canonical predicates at registration, resolves paraphrase-dodging through consensus equivalence, and rejects superficially-similar distractors while enforcing grounded quote verification. `CommitmentLedger` provides an original implementation of this pattern.
