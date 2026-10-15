# CommitmentLedger Intelligent Contract

Standalone Intelligent Contract running on GenLayer studionet that registers public commitments and verifies natural language resolution evidence through multi-validator consensus using allowlisted public source URLs, defeating paraphrase-dodging while rejecting superficially-similar distractors.

## Status

- **Network**: GenLayer Studionet (Chain ID `61999`, RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`). Status is Preview.
- **Contract Address**: [`0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB`](https://explorer-studio.genlayer.com/address/0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB)
- **Deploy Transaction Hash**: [`0x6654b4245ee74f4f1339ef13cdff1cf9654cb83714ed9e9810b81ba313f868d6`](https://explorer-studio.genlayer.com/tx/0x6654b4245ee74f4f1339ef13cdff1cf9654cb83714ed9e9810b81ba313f868d6)
- **Source SHA-256**: `9380175f322387696259a522483239be209d58b8e21fd4928cadf4ab46702e0e`
- **Schema Version**: `3.1.0`
- **SDK**: `genlayer-js` v1.1.8 (`chains.studionet`)

## What It Does

`CommitmentLedger` tracks public commitments (e.g. roadmap pledges, governance promises, public targets) without holding funds, requiring collateral, or relying on caller-authored evidence.

1. **Temporal Authenticity Classification**: Callers register commitment text alongside a mandatory calendar date deadline (`YYYY-MM-DD`). The contract compares the deadline to the current registration date. Commitments with future deadlines are tagged as `PROSPECTIVE` (`record_class: "ACCOUNTABILITY"`). Historical claims with deadlines on or before the registration date require an explicit `retrospective_ack=True` flag and are tagged as `RETROSPECTIVE` (`record_class: "RECORD_KEEPING"`), preventing past accomplishments from masquerading as forward-looking commitments.
2. **Claim Kind and Identity Attribution**: Callers must declare whether the commitment is `SELF_DECLARED` or a `THIRD_PARTY_REPORT`. The contract explicitly flags `identity_verified: false` to remind downstream systems that on-chain accounts are pseudonymous and off-chain identities are not verified by the ledger.
3. **Element-Based Adjudication of Full Statement**: Rather than evaluating isolated summary phrases, validators decompose the full raw statement into atomic elements (`ACTION`, `CONDITION`, `DEADLINE`). Each element is individually verified against retrieved evidence. Under the conjunction rule, a commitment is marked `KEPT` if and only if every element is `SATISFIED`. If any element is `NOT_SATISFIED`, the outcome is `BROKEN`. If key elements cannot be confirmed from the source, the transaction reverts as inconclusive, leaving the commitment `OPEN`.
4. **Deterministic Window Selection & Evidence Fingerprints**: When inspecting allowlisted public sources (`wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `nasa.gov`, `noaa.gov`, `ecb.europa.eu`), validators inspect up to 12,000 characters using deterministic keyword window selection. Each decision records a SHA-256 fingerprint of the inspected text to ensure evidence integrity.
5. **Bounded Challenge & Reconsideration State Machine**: Initial resolution places the commitment in `PROVISIONAL` status with a bounded challenge window (600 seconds on Studionet). During this period, any party may challenge the decision with a structured reason code (`UNSUPPORTED_CLASSIFICATION`, `CONFLICTING_EVIDENCE`). A challenge triggers an independent re-review under strict grounding rules. If the challenge exposes ungrounded claims, the decision is withdrawn and the commitment reverts to `OPEN`. If unchallenged before the window expires (or once the 3-decision budget is exhausted), `finalize_resolution` locks the decision permanently into `FINAL` status (note: "FINALIZED" refers to the transaction-level receipt status on GenLayer, while the on-chain commitment record status is `FINAL`).

## Quick Start

### Installation & Test Suite

```bash
npm install
npm test
npm run check
```

`npm run check` runs the full verification pipeline: unit tests, ASCII scans, banned word audits, secrets inspection, and evidence consistency assertions.

### Interacting with Contract

```javascript
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });
const CONTRACT_ADDRESS = "0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB";

// 1. Read commitment
const recordJson = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_commitment",
  args: ["15c567e44858"],
});
console.log(JSON.parse(recordJson));

// 2. Read decision history
const historyJson = await client.readContract({
  address: CONTRACT_ADDRESS,
  functionName: "get_decision_history",
  args: ["b90ed8cb5cf2"],
});
console.log(JSON.parse(historyJson));
```

## API Reference

| Method | Type | Parameters | Returns | Description |
| :--- | :--- | :--- | :--- | :--- |
| `register_commitment` | Write (Consensus) | `raw_text: str`, `deadline_hint: str`, `claim_kind: str = "SELF_DECLARED"`, `retrospective_ack: bool = False` | `commitment_id: str` | Registers commitment; validates calendar date `YYYY-MM-DD`; extracts canonical elements; enforces retrospective acknowledgement if deadline is not prospective. |
| `submit_resolution` | Write (Consensus) | `commitment_id: str`, `source_url: str` | `None` | Evaluates full statement against allowlisted source; records provisional decision with atomic elements and evidence SHA-256 fingerprint. Enforces `current_date >= deadline_hint`. |
| `challenge_resolution` | Write (Consensus) | `commitment_id: str`, `reason_code: str`, `rationale: str`, `countervailing_url: str = ""` | `None` | Challenges provisional decision within active challenge window; triggers strict re-adjudication; withdraws decision if grounding fails. |
| `finalize_resolution` | Write (Consensus) | `commitment_id: str` | `None` | Transitions provisional resolution to `FINAL` status once the challenge window has expired or the decision budget (`MAX_DECISIONS = 3`) is exhausted. |
| `get_commitment` | View (Read) | `commitment_id: str` | `str` (JSON) | Returns full commitment record (purely read-only). |
| `list_commitments_by_registrant` | View (Read) | `registrant: str`, `limit: int` | `str` (JSON array) | Discovery view returning recent commitments by an address without storage mutation. |
| `get_decision_history` | View (Read) | `commitment_id: str` | `str` (JSON array) | Returns complete audit trail of provisional and reconsideration decisions for a commitment. |

<!-- STUDIONET_EVIDENCE_START -->
## Studionet On-Chain Evidence Summary

All transactions below were executed and accepted by validators on GenLayer Studionet (Preview) with contract [`0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB`](https://explorer-studio.genlayer.com/address/0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB) (deploy transaction [`0x6654b4245ee74f4f1339ef13cdff1cf9654cb83714ed9e9810b81ba313f868d6`](https://explorer-studio.genlayer.com/tx/0x6654b4245ee74f4f1339ef13cdff1cf9654cb83714ed9e9810b81ba313f868d6)).

### Core Scenarios

| Case | Commitment ID | Register Tx | Resolve Tx | Receipt Status | Leader Result | Outcome | Stored Status | Source URL | Adjudication Details |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Case P1** (Genuine Prospective, OPEN) | `15c567e44858` | [`0xa2d9c6efc90cfddca01c61e437ce59623dcd757a88b3471f0d48d929389b232d`](https://explorer-studio.genlayer.com/tx/0xa2d9c6efc90cfddca01c61e437ce59623dcd757a88b3471f0d48d929389b232d) | None (Pending Maturity) | `ACCEPTED` | `SUCCESS` | `null` | `OPEN` | https://en.wikipedia.org/wiki/List_of_spaceflight_launches_in_October%E2%80%93December_2026 | Forward-looking SpaceX USSF-481 launch commitment. Matures on 2026-10-16. |
| **Case A** (Paraphrased Source, KEPT) | `98e5aceacf75` | [`0xc95736b8b5a6256255d9b178d06d7ba419bd645af44118d8c0f38e5e98db2ca0`](https://explorer-studio.genlayer.com/tx/0xc95736b8b5a6256255d9b178d06d7ba419bd645af44118d8c0f38e5e98db2ca0) | [`0x03d0945985554655360388e96a8ec48c3aafb094b0b6248fdb7768d32d58a88c`](https://explorer-studio.genlayer.com/tx/0x03d0945985554655360388e96a8ec48c3aafb094b0b6248fdb7768d32d58a88c) | `ACCEPTED` | `SUCCESS` | `KEPT` | `FINAL` | https://en.wikipedia.org/wiki/Apollo_11 | Elements e1, e2 SATISFIED. Evidence SHA-256 fingerprint verified. Marked `FINAL` on-chain via [`0x8b616611a308bb57bff06e6a49df4516b65f086b7f1a510c3a46b2088e8bb5ad`](https://explorer-studio.genlayer.com/tx/0x8b616611a308bb57bff06e6a49df4516b65f086b7f1a510c3a46b2088e8bb5ad) after 600s challenge window elapsed. |
| **Case B** (Contradicted Action, BROKEN) | `cc4b8e0115bc` | [`0x5223bd845ce2db170af423ce1b240acf87814af9cf08d51194f3df1f61f6c018`](https://explorer-studio.genlayer.com/tx/0x5223bd845ce2db170af423ce1b240acf87814af9cf08d51194f3df1f61f6c018) | [`0x4e7bc3d81505717d857e4c619e161ff1ef916120ee4f836438010b28ed8e2947`](https://explorer-studio.genlayer.com/tx/0x4e7bc3d81505717d857e4c619e161ff1ef916120ee4f836438010b28ed8e2947) | `ACCEPTED` | `SUCCESS` | `BROKEN` | `PROVISIONAL` | https://en.wikipedia.org/wiki/Apollo_13 | Action e1 ("land on the moon") marked `NOT_SATISFIED` due to oxygen tank explosion and mission abort. |
| **Case C** (Condition Omitted in Summary, BROKEN) | `8e8d07e65b36` | [`0x64f4447de40bcc867131e5178fbcff71d5273a8481cd7c29a78b420974b53b11`](https://explorer-studio.genlayer.com/tx/0x64f4447de40bcc867131e5178fbcff71d5273a8481cd7c29a78b420974b53b11) | [`0x997a8ae403c23fe702da3e1605386adad1398dc3ef99fefa9fff3473fa791fac`](https://explorer-studio.genlayer.com/tx/0x997a8ae403c23fe702da3e1605386adad1398dc3ef99fefa9fff3473fa791fac) | `ACCEPTED` | `SUCCESS` | `BROKEN` | `PROVISIONAL` | https://en.wikipedia.org/wiki/Apollo_11 | Compound condition "all three astronauts on lunar surface" evaluated; e2 marked `NOT_SATISFIED` as Collins stayed in orbit. |
| **Case D** (Mixed Elements, PARTIAL) | `2b8d6befe470` | [`0xb553f0ef6365db3a88168f2e8372939ffe57d2385875e3d659265d464c678b46`](https://explorer-studio.genlayer.com/tx/0xb553f0ef6365db3a88168f2e8372939ffe57d2385875e3d659265d464c678b46) | [`0x912cf28959512c89781e571ebe9289c041768dbe96a83a035bb97d60d721303d`](https://explorer-studio.genlayer.com/tx/0x912cf28959512c89781e571ebe9289c041768dbe96a83a035bb97d60d721303d) | `ACCEPTED` | `SUCCESS` | `PARTIAL` | `PROVISIONAL` | https://en.wikipedia.org/wiki/Apollo_11 | Elements e1, e2 SATISFIED; elements e3, e4 UNDETERMINED. 60.0% agreement (3/5 validators). |

#### Additional On-Chain Adjudication Runs (Disagreement Preserves Prior State)

- **Case A Initial Resolution Attempt** (`a1734d24cdcc`): Register [`0xfc5aecc8140abbfbf8205df048e9dfef82340a8f10d47c619a26866d9ac3674f`](https://explorer-studio.genlayer.com/tx/0xfc5aecc8140abbfbf8205df048e9dfef82340a8f10d47c619a26866d9ac3674f), Resolve [`0xfa1076448a7b116c04b970c22a35f6a172b9c268d57fe4390b4c623a26914204`](https://explorer-studio.genlayer.com/tx/0xfa1076448a7b116c04b970c22a35f6a172b9c268d57fe4390b4c623a26914204). Multi-validator comparative principle returned `MAJORITY_DISAGREE`, preserving the commitment securely in stored status `OPEN` without state mutation.
- **Case D Missed-Deadline Attempt** (`0689a0a5c7c3`): Resolve [`0x395eb380908774ad4ffd46dd6e7b1e7a27fd162149fa67d2d3e1b47a7a4a8a9d`](https://explorer-studio.genlayer.com/tx/0x395eb380908774ad4ffd46dd6e7b1e7a27fd162149fa67d2d3e1b47a7a4a8a9d) returned `MAJORITY_DISAGREE` (0/5 agree), keeping commitment securely `OPEN`.
- **Case PARTIAL Initial Attempt** (`60cd7d08c4e5`): Resolve [`0x996b51efd76c51f206eff9a5f2862006a4c163763a6c8dc9d3d0c5d0f25812cc`](https://explorer-studio.genlayer.com/tx/0x996b51efd76c51f206eff9a5f2862006a4c163763a6c8dc9d3d0c5d0f25812cc) returned `MAJORITY_DISAGREE` (0/5 agree, receipt status `UNDETERMINED`), safely leaving the record `OPEN`.

### 600-Second Challenge Window Finalization Proof

The contract strictly enforces a 600-second reconsideration window following provisional resolution when fewer than 3 decisions are recorded:

- **Commitment ID**: `98e5aceacf75`
- **Statement**: "The Apollo 11 lunar module landed on the Moon in July 1969."
- **Registration**: [`0xc95736b8b5a6256255d9b178d06d7ba419bd645af44118d8c0f38e5e98db2ca0`](https://explorer-studio.genlayer.com/tx/0xc95736b8b5a6256255d9b178d06d7ba419bd645af44118d8c0f38e5e98db2ca0)
- **Initial Resolution**: [`0x03d0945985554655360388e96a8ec48c3aafb094b0b6248fdb7768d32d58a88c`](https://explorer-studio.genlayer.com/tx/0x03d0945985554655360388e96a8ec48c3aafb094b0b6248fdb7768d32d58a88c) (Decided at `2026-10-14T11:11:12Z`, outcome: **KEPT**)
- **Early Finalize Attempt (<600s)**: [`0x63e292dc46966d58aa7bba49fb28c7737a9e9744f697bebca688d90d3cc7480a`](https://explorer-studio.genlayer.com/tx/0x63e292dc46966d58aa7bba49fb28c7737a9e9744f697bebca688d90d3cc7480a) -> Reverted on-chain with decoded payload `"challenge window still open"`.
- **Elapsed-Window Finalize (>=600s, 758s real elapsed)**: [`0x8b616611a308bb57bff06e6a49df4516b65f086b7f1a510c3a46b2088e8bb5ad`](https://explorer-studio.genlayer.com/tx/0x8b616611a308bb57bff06e6a49df4516b65f086b7f1a510c3a46b2088e8bb5ad) -> Receipt status `ACCEPTED`, leader execution `SUCCESS`, transitioning record to stored status **`FINAL`**.

### Challenge State Machine & Decisions History (Budget Exhausted Branch)

An on-chain multi-decision dispute flow was executed on Studionet with commitment `b90ed8cb5cf2`:

- **Registration**: [`0x5a272e9b482a7b5f63b4a83c2ac54f86e308d7f2436a35497e20c8ae9392733d`](https://explorer-studio.genlayer.com/tx/0x5a272e9b482a7b5f63b4a83c2ac54f86e308d7f2436a35497e20c8ae9392733d)
- **Initial Resolution (Decision 1, INITIAL)**: [`0xa7c88a13525b2ca32f0e52172dd8d8ed5ec96a3d50c6dbe4e53c0bd0a4b1a57b`](https://explorer-studio.genlayer.com/tx/0xa7c88a13525b2ca32f0e52172dd8d8ed5ec96a3d50c6dbe4e53c0bd0a4b1a57b) -> Decision 1: `PROVISIONAL`, **KEPT**.
- **Challenge 1 (Decision 2, UNSUPPORTED_CLASSIFICATION)**: [`0xbd57c320f56349b9d316e2161b7ca3330801e472078518155c5aef9402eb880a`](https://explorer-studio.genlayer.com/tx/0xbd57c320f56349b9d316e2161b7ca3330801e472078518155c5aef9402eb880a) -> Strict grounding re-review confirmed the landing passages -> Decision 2: **UPHELD** (`KEPT`).
- **Challenge 2 (Decision 3, CONFLICTING_EVIDENCE)**: [`0x2825907ab12db9a694b1a9b2ed52aa5fa3959677c3d8df6ba1f80a74f7e6207f`](https://explorer-studio.genlayer.com/tx/0x2825907ab12db9a694b1a9b2ed52aa5fa3959677c3d8df6ba1f80a74f7e6207f) -> Secondary source (Apollo program) confirmed mission success -> Decision 3: **UPHELD** (`KEPT`).
- **Finalize Transaction (Budget Exhausted)**: [`0x2c250713a3341c65198d8821f04352c50f31d9858942df0a8540a974abf484fe`](https://explorer-studio.genlayer.com/tx/0x2c250713a3341c65198d8821f04352c50f31d9858942df0a8540a974abf484fe) -> Decision limit reached (`MAX_DECISIONS = 3`), permitting immediate finalization to stored status **`FINAL`**.

### On-Chain Negative Rejection Tests

All revert payloads below were retrieved via JSON-RPC `eth_getTransactionByHash` and decoded from the leader receipt result field:

| Test | Submitted Parameter | Transaction Hash | Receipt Status | Leader Result | Revert Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Retrospective Without Ack | `1969-07-20` without ack | [`0xdf80eda2aab5778d3c2031f95aaaa288896b9ccb8c08fc548a07c8592dc827c2`](https://explorer-studio.genlayer.com/tx/0xdf80eda2aab5778d3c2031f95aaaa288896b9ccb8c08fc548a07c8592dc827c2) | `ACCEPTED` | `ERROR` | `"deadline is not after registration date; set retrospective_ack to record a historical claim"` |
| Invalid Claim Kind | `"UNOFFICIAL"` | [`0x5d27f8511d242393e92001d86ebfe1d5f9b671c8db19019a9dae3f698a1c07c1`](https://explorer-studio.genlayer.com/tx/0x5d27f8511d242393e92001d86ebfe1d5f9b671c8db19019a9dae3f698a1c07c1) | `ACCEPTED` | `ERROR` | `"claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT"` |
| Premature Resolution | `2099-01-01` before deadline | [`0x409553629451d66a6c8c8e26185ed13617187f79d8c7aada45231b64121bd95c`](https://explorer-studio.genlayer.com/tx/0x409553629451d66a6c8c8e26185ed13617187f79d8c7aada45231b64121bd95c) | `ACCEPTED` | `ERROR` | `"cannot resolve before deadline date"` |
| Distractor Source Rejection | Falcon 9 article for Apollo | [`0x9d5b07945b904f14d0488c81bf0bd5f792a86b4f81c3989ec02479a683017bf7`](https://explorer-studio.genlayer.com/tx/0x9d5b07945b904f14d0488c81bf0bd5f792a86b4f81c3989ec02479a683017bf7) | `ACCEPTED` | `ERROR` | `"source does not match this commitment"` |
| Non-Allowlisted Domain | `https://raw.githubusercontent.com/test` | [`0xa599c6963a5a1ae804e9b555c90f641ae5ce110187513c72b876076516f41f86`](https://explorer-studio.genlayer.com/tx/0xa599c6963a5a1ae804e9b555c90f641ae5ce110187513c72b876076516f41f86) | `ACCEPTED` | `ERROR` | `"source_url domain not in authorized allowlist"` |
| Challenge While Open | Challenge on unadjudicated claim | [`0x5b27ecd774aefabe1d255f2a75a036561be2ce149ec34158b483cff98238f87b`](https://explorer-studio.genlayer.com/tx/0x5b27ecd774aefabe1d255f2a75a036561be2ce149ec34158b483cff98238f87b) | `ACCEPTED` | `ERROR` | `"commitment is not in provisional status"` |
| Finalize While Open | Finalize on unadjudicated claim | [`0xa9af7835af5864a4275dcb630500edbdee683cddf73223549011777aef6e2325`](https://explorer-studio.genlayer.com/tx/0xa9af7835af5864a4275dcb630500edbdee683cddf73223549011777aef6e2325) | `ACCEPTED` | `ERROR` | `"commitment is not in provisional status"` |
| Early Finalize (Window Still Open) | Finalize before window expires | [`0xf8821f8a38b84c671b4e2e92655ac4bc1c672f15e4def544763ccf777e8c7083`](https://explorer-studio.genlayer.com/tx/0xf8821f8a38b84c671b4e2e92655ac4bc1c672f15e4def544763ccf777e8c7083) | `ACCEPTED` | `ERROR` | `"challenge window still open"` |

### Consensus Measurements & Validator Agreement Rates

Across empirical runs on GenLayer Studionet (Preview), successful consensus calls typically achieved 60.0% agreement (3 of 5 active validators agreeing under `gl.eq_principle.prompt_comparative`). Clear, unambiguous factual statements against well-structured Wikipedia articles reliably achieve majority consensus. By contrast, negative assertions or missed-deadline statements occasionally produce split validator evaluations (e.g. 0 of 5 agree, yielding `MAJORITY_DISAGREE` with receipt status `UNDETERMINED`), leaving the commitment securely in its prior state (`OPEN`) without state mutation.

| Operation | Tx Hash | Receipt Status | Consensus Result | Leader Execution | Latency (s) | Agreement Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `register_commitment` | [`0xa2d9c6efc90cfddca01c61e437ce59623dcd757a88b3471f0d48d929389b232d`](https://explorer-studio.genlayer.com/tx/0xa2d9c6efc90cfddca01c61e437ce59623dcd757a88b3471f0d48d929389b232d) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 32.34s | **60.0%** (3/5) |
| `register_commitment` | [`0xfc5aecc8140abbfbf8205df048e9dfef82340a8f10d47c619a26866d9ac3674f`](https://explorer-studio.genlayer.com/tx/0xfc5aecc8140abbfbf8205df048e9dfef82340a8f10d47c619a26866d9ac3674f) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 18.28s | **60.0%** (3/5) |
| `submit_resolution` | [`0x9d28208e095500ce401b38447d29cf5ca96f7a995117bbd5bf3875977cb1dbc1`](https://explorer-studio.genlayer.com/tx/0x9d28208e095500ce401b38447d29cf5ca96f7a995117bbd5bf3875977cb1dbc1) | `UNKNOWN` | `NO_MAJORITY` | `SUCCESS` | 41.02s | **0.0%** (0/1) |
| `register_commitment` | [`0x5223bd845ce2db170af423ce1b240acf87814af9cf08d51194f3df1f61f6c018`](https://explorer-studio.genlayer.com/tx/0x5223bd845ce2db170af423ce1b240acf87814af9cf08d51194f3df1f61f6c018) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 72.15s | **60.0%** (3/5) |
| `submit_resolution` | [`0x4e7bc3d81505717d857e4c619e161ff1ef916120ee4f836438010b28ed8e2947`](https://explorer-studio.genlayer.com/tx/0x4e7bc3d81505717d857e4c619e161ff1ef916120ee4f836438010b28ed8e2947) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 91.52s | **60.0%** (3/5) |
| `register_commitment` | [`0x64f4447de40bcc867131e5178fbcff71d5273a8481cd7c29a78b420974b53b11`](https://explorer-studio.genlayer.com/tx/0x64f4447de40bcc867131e5178fbcff71d5273a8481cd7c29a78b420974b53b11) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 28.13s | **60.0%** (3/5) |
| `submit_resolution` | [`0x997a8ae403c23fe702da3e1605386adad1398dc3ef99fefa9fff3473fa791fac`](https://explorer-studio.genlayer.com/tx/0x997a8ae403c23fe702da3e1605386adad1398dc3ef99fefa9fff3473fa791fac) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 39.22s | **60.0%** (3/5) |
| `register_commitment` | [`0xa0249e8b2742a1890e3dc7430d265e61ebb30adbeb6932439805c9b94f438f80`](https://explorer-studio.genlayer.com/tx/0xa0249e8b2742a1890e3dc7430d265e61ebb30adbeb6932439805c9b94f438f80) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 52.34s | **60.0%** (3/5) |
| `submit_resolution` | [`0x712bc24c671155061fb5bf2bac1062146de13c7503459c16fd2814e4a8225ee2`](https://explorer-studio.genlayer.com/tx/0x712bc24c671155061fb5bf2bac1062146de13c7503459c16fd2814e4a8225ee2) | `UNDETERMINED` | `MAJORITY_DISAGREE` | `SUCCESS` | 81.04s | **20.0%** (1/5) |
| `register_commitment` | [`0xfa0e1c4f1eb7acba0c3e41be2840a746a5fff25dcfd4e86281564026708390d7`](https://explorer-studio.genlayer.com/tx/0xfa0e1c4f1eb7acba0c3e41be2840a746a5fff25dcfd4e86281564026708390d7) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 182.41s | **60.0%** (3/5) |
| `submit_resolution` | [`0x996b51efd76c51f206eff9a5f2862006a4c163763a6c8dc9d3d0c5d0f25812cc`](https://explorer-studio.genlayer.com/tx/0x996b51efd76c51f206eff9a5f2862006a4c163763a6c8dc9d3d0c5d0f25812cc) | `UNDETERMINED` | `MAJORITY_DISAGREE` | `SUCCESS` | 237.99s | **0.0%** (0/5) |
| `register_commitment` | [`0xdf80eda2aab5778d3c2031f95aaaa288896b9ccb8c08fc548a07c8592dc827c2`](https://explorer-studio.genlayer.com/tx/0xdf80eda2aab5778d3c2031f95aaaa288896b9ccb8c08fc548a07c8592dc827c2) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 5.16s | **60.0%** (3/5) |
| `register_commitment` | [`0x5d27f8511d242393e92001d86ebfe1d5f9b671c8db19019a9dae3f698a1c07c1`](https://explorer-studio.genlayer.com/tx/0x5d27f8511d242393e92001d86ebfe1d5f9b671c8db19019a9dae3f698a1c07c1) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 5.08s | **100.0%** (5/5) |
| `submit_resolution` | [`0x409553629451d66a6c8c8e26185ed13617187f79d8c7aada45231b64121bd95c`](https://explorer-studio.genlayer.com/tx/0x409553629451d66a6c8c8e26185ed13617187f79d8c7aada45231b64121bd95c) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.46s | **60.0%** (3/5) |
| `register_commitment` | [`0x494d3deb4e6b208cab828210810ae52abbae522860a6f7240b0a56ee0d841afc`](https://explorer-studio.genlayer.com/tx/0x494d3deb4e6b208cab828210810ae52abbae522860a6f7240b0a56ee0d841afc) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 18.29s | **60.0%** (3/5) |
| `submit_resolution` | [`0x9d5b07945b904f14d0488c81bf0bd5f792a86b4f81c3989ec02479a683017bf7`](https://explorer-studio.genlayer.com/tx/0x9d5b07945b904f14d0488c81bf0bd5f792a86b4f81c3989ec02479a683017bf7) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 21.56s | **60.0%** (3/5) |
| `submit_resolution` | [`0xa599c6963a5a1ae804e9b555c90f641ae5ce110187513c72b876076516f41f86`](https://explorer-studio.genlayer.com/tx/0xa599c6963a5a1ae804e9b555c90f641ae5ce110187513c72b876076516f41f86) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.42s | **60.0%** (3/5) |
| `challenge_resolution` | [`0x5b27ecd774aefabe1d255f2a75a036561be2ce149ec34158b483cff98238f87b`](https://explorer-studio.genlayer.com/tx/0x5b27ecd774aefabe1d255f2a75a036561be2ce149ec34158b483cff98238f87b) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.41s | **100.0%** (5/5) |
| `finalize_resolution` | [`0xa9af7835af5864a4275dcb630500edbdee683cddf73223549011777aef6e2325`](https://explorer-studio.genlayer.com/tx/0xa9af7835af5864a4275dcb630500edbdee683cddf73223549011777aef6e2325) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 5.12s | **100.0%** (5/5) |
| `register_commitment` | [`0x5a272e9b482a7b5f63b4a83c2ac54f86e308d7f2436a35497e20c8ae9392733d`](https://explorer-studio.genlayer.com/tx/0x5a272e9b482a7b5f63b4a83c2ac54f86e308d7f2436a35497e20c8ae9392733d) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 21.68s | **60.0%** (3/5) |
| `submit_resolution` | [`0xa7c88a13525b2ca32f0e52172dd8d8ed5ec96a3d50c6dbe4e53c0bd0a4b1a57b`](https://explorer-studio.genlayer.com/tx/0xa7c88a13525b2ca32f0e52172dd8d8ed5ec96a3d50c6dbe4e53c0bd0a4b1a57b) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 21.73s | **60.0%** (3/5) |
| `finalize_resolution` | [`0xf8821f8a38b84c671b4e2e92655ac4bc1c672f15e4def544763ccf777e8c7083`](https://explorer-studio.genlayer.com/tx/0xf8821f8a38b84c671b4e2e92655ac4bc1c672f15e4def544763ccf777e8c7083) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 5.04s | **60.0%** (3/5) |
| `challenge_resolution` | [`0xbd57c320f56349b9d316e2161b7ca3330801e472078518155c5aef9402eb880a`](https://explorer-studio.genlayer.com/tx/0xbd57c320f56349b9d316e2161b7ca3330801e472078518155c5aef9402eb880a) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 114.34s | **75.0%** (3/4) |
| `challenge_resolution` | [`0x2825907ab12db9a694b1a9b2ed52aa5fa3959677c3d8df6ba1f80a74f7e6207f`](https://explorer-studio.genlayer.com/tx/0x2825907ab12db9a694b1a9b2ed52aa5fa3959677c3d8df6ba1f80a74f7e6207f) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 31.35s | **60.0%** (3/5) |
| `finalize_resolution` | [`0x2c250713a3341c65198d8821f04352c50f31d9858942df0a8540a974abf484fe`](https://explorer-studio.genlayer.com/tx/0x2c250713a3341c65198d8821f04352c50f31d9858942df0a8540a974abf484fe) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 8.43s | **100.0%** (5/5) |

### Unit-Tested Only (Not On-Chain)

The following scenarios and edge cases were rigorously verified in the Python unit test suite (`tests/test_layer1_pure.py`, `tests/test_layer2_mocked.py`, `tests/test_step0_regressions.py`), but were not reproducible on-chain or were intentionally reserved for mock environments:

1. **UNSUPPORTED_CLASSIFICATION Yielding WITHDRAWN**: In our on-chain test (`b90ed8cb5cf2`), re-evaluating the Apollo 11 source under strict grounding re-confirmed the landing passages, yielding `UPHELD`. The `WITHDRAWN` branch (where model grounding fails to find cited text and safely resets status to `OPEN`) is comprehensively verified in `test_challenge_unsupported_classification_flow`.
2. **CONFLICTING_EVIDENCE Yielding DISPUTED**: In our on-chain challenge (`b90ed8cb5cf2`), the secondary source (Apollo program) confirmed the lunar landing, upholding the outcome. Creating a genuine `DISPUTED` outcome on-chain requires two reputable allowlisted sources with authentic contradicting assertions; this branch is strictly verified in `test_challenge_conflicting_evidence_flow`.
3. **Retrospective Missed-Deadline Yielding BROKEN**: On-chain attempt (`0689a0a5c7c3`, tx `0x395eb380908774ad4ffd46dd6e7b1e7a27fd162149fa67d2d3e1b47a7a4a8a9d`) resulted in validator disagreement (`MAJORITY_DISAGREE`, 0/5 agree), leaving the commitment `OPEN`. The deterministic outcome mapping for missed deadlines is verified in unit tests.
4. **Fourth Challenge Attempt Rejection**: Attempting a 4th challenge once `MAX_DECISIONS = 3` is reached reverts with `"challenge limit reached"`. Verified in `test_challenge_limit_reached`.
5. **Malformed JSON & Missing Attributes**: Synthetic LLM outputs returning missing elements, non-object JSON roots, or invalid schema types revert with `"malformed consensus result"` and do not alter state.
6. **Storage Nonce Neutrality on Rejected Registration**: Registrations that revert for invalid deadline dates, empty text, or unacknowledged retrospective deadlines touch zero storage and do not increment nonces.

For detailed evidence JSON records and receipts, see [docs/EVIDENCE.md](docs/EVIDENCE.md). For contract source code verification, see [docs/VERIFICATION.md](docs/VERIFICATION.md).

<!-- STUDIONET_EVIDENCE_END -->

## Trust Model & Limitations

1. **Who Can Register and Resolve**: Any address can register a commitment (`raw_text <= 400` chars, strict calendar date `YYYY-MM-DD`). Once the deadline date is reached, any address can submit a resolution with an allowlisted public source URL. Callers cannot provide self-written evidence text.
2. **State Machine Lifecycle**: A resolution remains `PROVISIONAL` during the challenge window. Once concluded, the record status becomes `FINAL` and cannot be re-adjudicated (the transaction receipt reaches "FINALIZED").
3. **Source Text Bound**: The contract deterministically selects keyword-relevant windows from retrieved web text (up to 12,000 characters) to fit within LLM context bounds and ensure deterministic multi-validator consensus.
4. **Throwaway Account**: Transactions in this repository were signed using an automated throwaway dev account holding studionet GEN with zero real-world value.
5. **External Source Scope**: The contract does not verify ultimate real-world truth beyond what allowlisted public sources assert at resolution time. It does not monitor external web pages for retroactive revisions.

## Repository Layout

```text
.
├── contracts/
│   ├── CommitmentLedger.py    # Standalone Intelligent Contract (SCHEMA 3.1.0)
│   └── Probe.py               # Runtime probe for platform primitives
├── docs/
│   ├── DESIGN.md              # Architectural design and consensus cascade
│   ├── EVIDENCE.md            # Complete on-chain evidence with read-backs
│   ├── INTEGRATION.md         # Client and future dApp integration guide
│   ├── PRIOR_ART.md           # Prior art analysis and landscape comparison
│   ├── RUNTIME_NOTES.md       # Probe results and platform observations
│   └── VERIFICATION.md        # Byte-for-byte on-chain source hash verification
├── scripts/
│   ├── check_evidence_consistency.py  # Evidence structure and hash format validation
│   ├── scan_ascii.py                  # ASCII character validator
│   ├── scan_banned_words.py           # Banned marketing/jargon scanner
│   ├── scan_secrets.py                # Secret leakage detection scanner
│   ├── verify_source.js               # On-chain contract source code verification script
│   ├── deploy/
│   │   ├── deploy.js                  # Deployment script
│   │   ├── deployments.json           # Active and superseded deployment records
│   │   ├── live_evidence.json         # Raw on-chain transaction evidence
│   │   ├── run_challenge_flow.js      # Challenge & dispute flow runner
│   │   ├── run_evidence.js            # Automated evidence runner
│   │   └── verification_result.json   # JSON-RPC verification output
│   └── tools/
│       ├── decode_revert.js           # Revert payload decoder CLI
│       ├── read_commitment.js         # On-chain commitment reader CLI
│       └── render_evidence_md.js      # Evidence markdown generator
└── tests/                             # Python unit test suite
```

## Superseded Deployments

The following contracts were deployed during development and have been superseded:

| Address | Deploy Transaction Hash | Superseded Reason |
| :--- | :--- | :--- |
| `0xdD0d120B50ED65400E8b6a060bB15103B42544E8` | [`0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467`](https://explorer-studio.genlayer.com/tx/0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467) | Superseded by v3.1.0: fixed outcome mapping truth table, dynamic current_decision_index, presented segments fingerprinting, robust HTML stripper, strict budget counting, UTC time derivation, strict JSON schema validation, and storage init ordering. |
| `0x3155c7c80f4334968d61E1b79f74EB864CF7cb08` | [`0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a`](https://explorer-studio.genlayer.com/tx/0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a) | Superseded by v3.0.0: answered steward review with temporal authenticity, element-based adjudication of full original statement, claim kind/identity unverified, bounded challenge & reconsideration state machine, and sha256 evidence fingerprints. |
| `0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1` | [`0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52`](https://explorer-studio.genlayer.com/tx/0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52) | Superseded by v2.2.0: could write PARTIAL when model returned no valid outcome. |
| `0x8a5269aa724E77D799b3F0dbbaeee7683157f52d` | [`0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b`](https://explorer-studio.genlayer.com/tx/0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b) | Superseded by v2.1.0: removed ungrounded fallback and enforced mandatory calendar date deadlines. |
| `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` | [`0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235`](https://explorer-studio.genlayer.com/tx/0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235) | Initial caller-written text prototype, superseded by source-based resolution. |

## License

MIT License. Copyright (c) 2026 Hyper (`huzyow155`).
