# CommitmentLedger Intelligent Contract

Standalone Intelligent Contract running on GenLayer studionet that registers public commitments and verifies natural language resolution evidence through multi-validator consensus using allowlisted public source URLs, defeating paraphrase-dodging while rejecting superficially-similar distractors.

## The Problem: Paraphrase-Dodging & Caller Circularity

Public commitments (a DAO steward's roadmap promise, a project's stated deadline, an executive's public pledge) are easily dodged by restating them in different wording later (*"I never said Q2, I said 'this half of the year'"*).

- **Exact string / hash matching** is trivially defeated by paraphrase: any synonym change, passive-to-active conversion, or reordered clause breaks the linkage entirely.
- **Caller-supplied evidence** creates circularity: if a caller supplies their own text, a "grounded quote" only proves the quote is in caller-written text. The registrant can self-certify `KEPT` or an attacker can front-run with `BROKEN`.
- **Naive fuzzy matching** conflates superficial distractors (same subject, different action/timeline) with actual fulfillments.

## Why GenLayer?

`CommitmentLedger` leverages GenLayer's **Optimistic Democracy** and `gl.eq_principle.strict_eq`:
1. **Canonical Extraction at Registration**: When a commitment is registered, consensus validators extract a normalized canonical predicate (`subject`, `action`), storing it on-chain. Input text is wrapped in `<UNTRUSTED_TEXT>` delimiters to prevent prompt injection.
2. **Allowlisted Source-Based Resolution (Option A)**: Anyone can submit a resolution, but instead of caller-written text, the caller must submit an allowlisted public source URL (`wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`). The contract fetches and evaluates the page text directly.
3. **Deterministic Outcome Gate**:
   - If validators agree the fetched source does **not** match (`NOMATCH`), the transaction raises `UserError("evidence does not match this commitment")`, leaving the commitment open.
   - If the source matches, the outcome is classified (`KEPT`, `BROKEN`, `PARTIAL`).
   - A grounded verbatim quote (>= 12 characters from the fetched page) is strictly enforced: an ungrounded quote forces `PARTIAL`, never a confident `KEPT` or `BROKEN`.

## Contract Coordinates (GenLayer Studionet)

- **Network**: GenLayer Studionet (Preview)
- **Contract Address**: [`0x8a5269aa724E77D799b3F0dbbaeee7683157f52d`](https://explorer-studio.genlayer.com/address/0x8a5269aa724E77D799b3F0dbbaeee7683157f52d)
- **Deploy Transaction**: [`0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b`](https://explorer-studio.genlayer.com/tx/0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b)
- **Chain ID**: `61999`
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer Base**: `https://explorer-studio.genlayer.com`
- **SDK**: `genlayer-js` v1.1.8 (`chains.studionet`)

### Superseded Deployments

| Address | Deploy Transaction Hash | Superseded Note |
| :--- | :--- | :--- |
| `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` | `0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235` | Initial caller-written text prototype, superseded by source-URL allowlisted resolution (Option A). |

## API Specification

| Method | Type | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- | :--- |
| `register_commitment` | Write (Consensus) | `raw_text: str`, `deadline_hint: str` | `commitment_id: str` | Registers commitment; extracts canonical `{subject, action}` via consensus. |
| `submit_resolution` | Write (Consensus) | `commitment_id: str`, `source_url: str` | `None` | Semantic match verification and grounded quote classification from allowlisted source URL. |
| `get_commitment` | View (Read) | `commitment_id: str` | `str` (JSON) | Returns full commitment record (purely read-only). |
| `list_commitments_by_registrant` | View (Read) | `registrant: str`, `limit: int` | `str` (JSON array) | Discovery view returning recent commitments by an address without storage mutation. |

## Studionet Deployment & Verification Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite
```bash
python -m unittest discover tests
```

### 3. Run Quality Scans
```bash
python scripts/scan_ascii.py
python scripts/scan_banned_words.py
python scripts/scan_secrets.py
```

### 4. Deploy Contract to Studionet
```bash
node scripts/deploy/deploy_hardened.js
```

### 5. Verify Source on Studionet
```bash
node scripts/verify_source.js
```

## Trap Test & On-Chain Evidence Summary

All scenarios were executed against real public sources on GenLayer studionet:

| Case | Commitment ID | Register Tx | Resolve Tx | Status Name | Leader Result | Outcome | Source URL Used | Quote |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Case A (Trap Test)** | `8a63544a69ae` | `0xb8e93ea8...444c97` | `0xdbb253da...cb05b6` | `ACCEPTED` | `SUCCESS` | `KEPT` | `https://en.wikipedia.org/wiki/Apollo_11` | `"Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon"` |
| **Case B (Broken)** | `1bd851211272` | `0xb4d3c34a...db8b8e` | `0x7183c200...4ffebf` | `ACCEPTED` | `SUCCESS` | `BROKEN` | `https://en.wikipedia.org/wiki/Apollo_13` | `"the landing was aborted after an oxygen tank in the service module (SM) exploded two days into the mission"` |
| **Case C (Distractor Rejection)** | `1ea0bb1afb96` | `0x22e89f26...55a16` | `0x36d4e79e...17ba3c` | `ACCEPTED` | `ERROR` | `null` (status `OPEN`) | `https://en.wikipedia.org/wiki/Falcon_9` | Reverted with `"evidence does not match this commitment"`, commitment preserved `OPEN` |
| **Case D (Partial)** | `97f371c297a3` | `0x54bda901...00b99` | `0xb99852b6...71ec26` | `ACCEPTED` | `SUCCESS` | `PARTIAL` | `https://en.wikipedia.org/wiki/Apollo_11` | null (grounding forces `PARTIAL`) |

### On-Chain Negative Rejection Tests

| Test | Submitted Parameter | Transaction Hash | Status Name | Leader Execution Result | Revert Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Non-Allowlisted Domain | `https://github.com/nasa/webb` | `0x2cfdf0270312ac9cc255ba5c94f8b9bf4d976920413d4416023e35ed70641113` | `ACCEPTED` | `ERROR` | `"source_url domain not in authorized allowlist"` |
| Insecure HTTP Scheme | `http://en.wikipedia.org/wiki/James_Webb_Space_Telescope` | `0x19d24e5d6fe23a0025c60336b3b8ae3a54d0fa0690e264861be647ee8a60e446` | `ACCEPTED` | `ERROR` | `"source_url scheme must be https"` |

## Trust Model and Known Limitations

### Who Can Register and Resolve
- **Registration**: Any address can register a commitment (`raw_text <= 400` characters, optional `deadline_hint`).
- **Resolution**: Any address can submit a resolution, but **only by providing an allowlisted public source URL** that the contract fetches directly. Callers cannot submit caller-written resolution text.

### What the Contract Proves and Does Not Prove
- **What it proves**: Multi-validator consensus agreed that the fetched source text semantically describes the registered commitment and extracted a verbatim grounded passage justifying the score.
- **What it does not prove**:
  - The contract does not verify real-world truth beyond what the allowlisted source asserts.
  - The contract does not monitor source modifications made after resolution.
  - The contract does not arbitrate editorial moderation on third-party domains.
- **Allowlist Scope**: Fixed at the contract level to major public references (`wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`). User-authored publishing domains (e.g. GitHub, Pastebin, social platforms) are excluded.
- **Consensus Latency**: Multi-validator web fetch and LLM evaluation averages 15 to 35 seconds per transaction on studionet.

## License

MIT License. Copyright (c) 2026 Hyper (`huzyow155`).
