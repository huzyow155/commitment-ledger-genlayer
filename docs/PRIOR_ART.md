# Prior Art Analysis: Commitment Tracking & Semantic Claim Matching

This document analyzes prior art across GenLayer and decentralized systems regarding commitment tracking, promise ledgers, and semantic claim matching.

## Landscape Overview

In decentralized applications and agentic systems, tracking commitments (promises, roadmaps, deadlines) has traditionally relied on:
1. **Exact string or hash matching**: Storing a digest of an agreed statement. Any textual variation, paraphrase, or slight clarification results in a completely different hash, failing match checks.
2. **Oracle / Human Attestation**: Relying on external multi-sigs, human juries (e.g. Kleros), or centralized oracles to manually interpret whether an action fulfilled a stated roadmap pledge.
3. **Escrow / Dispute Protocols**: For example, agentic commerce frameworks (such as the COMMIT protocol conceptualization) where agents lock collateral and validators settle claims based on task specifications.

## Comparison Table

| System / Approach | Mechanism | Paraphrase Handling | Outcome Classification | Trust Model |
| :--- | :--- | :--- | :--- | :--- |
| **Exact Hash / Text Registry** | Exact keccak256 or string comparison | Fails when phrasing changes: Any rephrasing or synonym change breaks linkage. | Boolean (exact match only). | Deterministic EVM code. |
| **Human Jury (e.g., Kleros / Aragon)** | Human jurors review evidence in natural language. | Subjective human reading. | Subjective voting by token holders. | Economic incentive game; slow (days to weeks), expensive. |
| **Agentic Promise Escrows (e.g., COMMIT)** | Collateralized agent escrows with task SLAs. | Evaluates deliverables against schemas or programmatic APIs. | Pass/Fail escrow release based on task completion. | Escrow-focused; requires locked funds and financial incentives. |
| **CommitmentLedger (This Work)** | Intelligent Contract with two-phase consensus: canonical predicate extraction at registration (`subject`, `action`) + consensus semantic matching at resolution via allowlisted public source URLs. | Automated semantic evaluation: validators assess whether the fetched public source addresses the same commitment regardless of sentence structure, synonyms, or clause reordering. | Deterministic scoring (`KEPT`, `BROKEN`, `PARTIAL`) enforced with grounded verbatim quotes (>=12 chars) from allowlisted sources. Non-matching sources are rejected. | Multi-validator consensus via GenLayer `strict_eq`; no funds, no tokens, transparent accountability. |

## Detailed Comparison Points

### 1. The Paraphrase-Dodging Vulnerability
Traditional commitment registries suffer from paraphrase vulnerability:
- A speaker pledges: *"We will ship the audited governance token staking module before the end of Q3 2026."*
- When held accountable, bad actors dodge by pointing out phrasing differences or claiming resolutions apply to different statements.
- Conversely, automated keyword searches cannot match resolution evidence phrased as: *"In September 2026, the team successfully launched their verified staking contract following the completion of the audit."*
- `CommitmentLedger` extracts normalized canonical predicates (`subject` and `action`) upon registration. When a source URL is submitted, multi-validator consensus checks whether the fetched source text semantically pertains to that original commitment.

### 2. Trap Defense (Superficial Similarity vs. Genuine Paraphrase)
A naive fuzzy matcher or loose semantic search might conflate:
- Original: *"Alice will deploy the cross-chain liquidity bridge by August."*
- Different action: *"Alice deployed the cross-chain NFT bridge in August."* (Superficially similar subject and timeline, but completely different action).
`CommitmentLedger` validators evaluate whether the action in the source text matches the registered commitment action, rejecting distractors with a `gl.vm.UserError("evidence does not match this commitment")`, leaving the commitment open.

### 3. Source-Based Grounded Quote Requirement
To prevent circularity and hallucinations:
- Resolution evidence is fetched directly by the contract from an allowlisted public source domain (`wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`).
- Callers cannot supply arbitrary caller-written evidence text.
- Quoted text must be at least 12 characters long.
- Quoted text must exist verbatim within the fetched public page text.
- If a quote fails grounded verification, the outcome is forced to `PARTIAL`, preventing ungrounded `KEPT` or `BROKEN` verdicts.
