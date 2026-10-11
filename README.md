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
- **Contract Address**: [`0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1`](https://explorer-studio.genlayer.com/address/0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1)
- **Deploy Transaction**: [`0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52`](https://explorer-studio.genlayer.com/tx/0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52)
- **Chain ID**: `61999`
- **RPC URL**: `https://studio.genlayer.com/api`
- **Explorer Base**: `https://explorer-studio.genlayer.com`
- **SDK**: `genlayer-js` v1.1.8 (`chains.studionet`)

### Superseded Deployments

| Address | Deploy Transaction Hash | Superseded Note |
| :--- | :--- | :--- |
| `0x8a5269aa724E77D799b3F0dbbaeee7683157f52d` | `0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b` | Superseded by v2.1.0: removed ungrounded fallback and enforced mandatory calendar date deadlines. |
| `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` | `0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235` | Initial caller-written text prototype, superseded by source-URL allowlisted resolution (Option A). |

## API Specification

| Method | Type | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- | :--- |
| `register_commitment` | Write (Consensus) | `raw_text: str`, `deadline_hint: str` | `commitment_id: str` | Registers commitment; validates strict calendar date `YYYY-MM-DD`; extracts canonical `{subject, action}` via consensus. |
| `submit_resolution` | Write (Consensus) | `commitment_id: str`, `source_url: str` | `None` | Semantic match verification and grounded quote classification from allowlisted source URL. Enforces `current_date >= deadline_hint`. |
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

All scenarios were executed against real public sources on GenLayer studionet with contract `0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1`:

| Case | Commitment ID | Register Tx | Resolve Tx | Status Name | Leader Result | Outcome | Source URL Used | Quote |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Case A (Trap Test)** | `bd37d1fb57d3` | `0x18722b91...dff1c` | `0xe745e76c...3ed0c` | `ACCEPTED` | `SUCCESS` | `KEPT` | `https://en.wikipedia.org/wiki/Apollo_11` | `"Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon"` |
| **Case B (Broken)** | `8957209fbf0c` | `0xb4148c73...87b86` | `0xfabe1ec4...9260ee` | `ACCEPTED` | `SUCCESS` | `BROKEN` | `https://en.wikipedia.org/wiki/Apollo_13` | `"the landing was aborted after an oxygen tank in the service module (SM) exploded two days into the mission"` |
| **Case C (Distractor Rejection)** | `777cff3cd53d` | `0x9d23690a...13a1` | `0xfb42396d...945a3` | `ACCEPTED` | `ERROR` | `null` (status `OPEN`) | `https://en.wikipedia.org/wiki/Falcon_9` | Reverted with `"source does not match this commitment"`, commitment preserved `OPEN` |
| **Case D (Broad Objectives)** | `5acebf3f7a12` | `0x77109e7f...ef652` | `0x0ee9c652...61aff` | `ACCEPTED` | `SUCCESS` | `KEPT` | `https://en.wikipedia.org/wiki/Apollo_11` | `"After more than 21 hours on the surface, they rejoined Collins in lunar orbit, and the crew returned safely to Earth on July 24"` |

### On-Chain Negative Rejection Tests

| Test | Submitted Parameter | Transaction Hash | Status Name | Leader Execution Result | Revert Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Non-Allowlisted Domain | `https://github.com/nasa/webb` | `0x3db3ee1df9f6a5355f1ffb335d21a7ea45f487c87b6ce470a393f535b1d508f7` | `ACCEPTED` | `ERROR` | `"source_url domain not in authorized allowlist"` |
| Insecure HTTP Scheme | `http://en.wikipedia.org/wiki/Falcon_9` | `0x5180df851b7bf0c6bd4af7483df445e4b1dfaf747512b4bb1ded61430f0889d2` | `ACCEPTED` | `ERROR` | `"source_url scheme must be https"` |
| Free-Text Deadline | `"end of Q2"` | `0xee70c7ad2011db0ad86a1ec12c802e6c4556002700293ad0322c66c6772880a5` | `ACCEPTED` | `ERROR` | `"deadline_hint must be YYYY-MM-DD"` |
| Premature Resolution | `2099-01-01` before deadline | `0x43f6587c18ae2f9b3d34c4c99ca056a9fc8b122e6c1e967ce96a51d594e42535` | `ACCEPTED` | `ERROR` | `"cannot resolve before deadline date"` |
| Already Resolved | Resolution on `bd37d1fb57d3` | `0xb700d2e9be062c18b973dadbc5f5e97cb9cda337ebab1381ac5d20a60d43a666` | `ACCEPTED` | `ERROR` | `"commitment already resolved"` |

## Trust Model and Known Limitations

### Who Can Register and Resolve
- **Registration**: Any address can register a commitment (`raw_text <= 400` characters, strict calendar date `deadline_hint` in `YYYY-MM-DD` format).
- **Resolution**: Any address can submit a resolution once the deadline date has arrived (`current_date >= deadline_hint`), but **only by providing an allowlisted public source URL** that the contract fetches directly. Callers cannot submit caller-written resolution text.

### Irreversibility and Permanent Finality
- Once a commitment is resolved (`RESOLVED`), its status and outcome are permanent and immutable on-chain. Further calls to `submit_resolution` are rejected (`UserError("commitment already resolved")`).
- A caller who reaches consensus with a legitimate allowlisted source page finalizes the outcome for all participants.

### Post-Deadline Resolution by Any Caller
- Because any caller can trigger resolution after the deadline date, an external observer or counterparty can finalize an outcome as soon as the allowlisted source reports it.
- Resolving before the stated deadline is strictly rejected by the deterministic clock check (`cannot resolve before deadline date`).

### Source Dynamics and Historical Demos
- The contract fetches the source page at the moment of the resolution transaction; it does **not** continuously monitor or re-evaluate the source page for later edits.
- The on-chain demonstration cases use historical public events (Apollo 11 and Apollo 13 lunar landings) whose outcomes are well-documented on Wikipedia, satisfying the strict calendar deadline requirement while demonstrating true semantic matching across natural language texts.

### What the Contract Proves and Does Not Prove
- **What it proves**: Multi-validator consensus agreed that the fetched source text semantically describes the registered commitment, verified that the transaction occurred on or after the deadline date, and extracted a verbatim grounded passage justifying the classification.
- **What it does not prove**:
  - The contract does not verify real-world truth beyond what the allowlisted source asserts.
  - The contract does not monitor source modifications made after resolution.
  - The contract does not arbitrate editorial moderation on third-party domains.
- **Allowlist Scope**: Fixed at the contract level to major public references (`wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`). User-authored publishing domains (e.g. GitHub, Pastebin, social platforms) are excluded.
- **Consensus Latency**: Multi-validator web fetch and LLM evaluation averages 15 to 35 seconds per transaction on studionet.

## License

MIT License. Copyright (c) 2026 Hyper (`huzyow155`).
