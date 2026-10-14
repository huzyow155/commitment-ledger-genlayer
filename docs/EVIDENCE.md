# On-Chain Evidence: CommitmentLedger v3.1.0

This document records the exact, verified on-chain evidence transactions executed on GenLayer Studionet (Preview) for contract `0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB`.

- **Active Contract Address**: [`0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB`](https://explorer-studio.genlayer.com/address/0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB)
- **Deploy Transaction Hash**: [`0x6654b4245ee74f4f1339ef13cdff1cf9654cb83714ed9e9810b81ba313f868d6`](https://explorer-studio.genlayer.com/tx/0x6654b4245ee74f4f1339ef13cdff1cf9654cb83714ed9e9810b81ba313f868d6)
- **Phase 1 Execution Completed**: `2026-10-14T09:33:38.072Z`
- **Phase 2 Pending Maturity Date**: `2026-10-16`

## 1. Prospective Registration (Phase 1 Recorded, Phase 2 Pending)

### Case P1 (Prospective Registration, OPEN)

- **Commitment ID**: `15c567e44858`
- **Statement**: "SpaceX will launch the USSF-481 mission for the United States Space Force from Vandenberg on or before 2026-10-16."
- **Deadline**: `2026-10-16`
- **Target Source URL**: https://en.wikipedia.org/wiki/List_of_spaceflight_launches_in_October%E2%80%93December_2026
- **Registration Transaction**: [`0xa2d9c6efc90cfddca01c61e437ce59623dcd757a88b3471f0d48d929389b232d`](https://explorer-studio.genlayer.com/tx/0xa2d9c6efc90cfddca01c61e437ce59623dcd757a88b3471f0d48d929389b232d)
- **Receipt Status**: `ACCEPTED`
- **Leader Execution**: `SUCCESS`
- **Record Status**: `OPEN`
- **Registration Class**: `PROSPECTIVE`
- **Record Class**: `ACCOUNTABILITY`
- **Claim Kind**: `THIRD_PARTY_REPORT`

```json
{
  "schema_version": "3.1.0",
  "commitment_id": "15c567e44858",
  "registrant": "0x2555211a1f3568343759DeBdaFBCEA9BC7A4f25B",
  "raw_text": "SpaceX will launch the USSF-481 mission for the United States Space Force from Vandenberg on or before 2026-10-16.",
  "subject": "spacex",
  "action": "launch ussf-481 for u.s. space force from vandenberg",
  "deadline_hint": "2026-10-16",
  "registered_at": "2026-10-14T09:32:32Z",
  "registered_at_ts": 1791970352,
  "registered_date": "2026-10-14",
  "registration_class": "PROSPECTIVE",
  "record_class": "ACCOUNTABILITY",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 1,
  "status": "OPEN",
  "challenge_deadline_ts": null,
  "current_decision_index": -1,
  "decisions": [],
  "outcome": null,
  "source_url": null,
  "resolution_quote": null,
  "match_confirmed": false,
  "resolved_at": null,
  "resolver": null
}
```

## 2. Verified Case Resolutions

### Case A (Paraphrased Source, Disagreed / OPEN)

- **Commitment ID**: `a1734d24cdcc`
- **Raw Text**: "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970."
- **Deadline**: `1970-01-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_11
- **Register Transaction Hash**: [`0xfc5aecc8140abbfbf8205df048e9dfef82340a8f10d47c619a26866d9ac3674f`](https://explorer-studio.genlayer.com/tx/0xfc5aecc8140abbfbf8205df048e9dfef82340a8f10d47c619a26866d9ac3674f)
- **Resolve Transaction Hash**: [`0xfa1076448a7b116c04b970c22a35f6a172b9c268d57fe4390b4c623a26914204`](https://explorer-studio.genlayer.com/tx/0xfa1076448a7b116c04b970c22a35f6a172b9c268d57fe4390b4c623a26914204)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `NONE (Reverted/Open)`
- **Evidence Preimage SHA-256**: `N/A`
- **Inspected Text SHA-256**: `N/A`
- **Window Coverage**: `N/A` (0 / 0 chars inspected, budget used: 0 chars, segments presented: 0)

#### Resolution Attempts

| Attempt | Tx Hash | Status | Consensus | Note |
|---|---|---|---|---|
| 1 | [`0x9d28208e095500ce401b38447d29cf5ca96f7a995117bbd5bf3875977cb1dbc1`](https://explorer-studio.genlayer.com/tx/0x9d28208e095500ce401b38447d29cf5ca96f7a995117bbd5bf3875977cb1dbc1) | `UNKNOWN` | `NO_MAJORITY` | Studionet RPC 502 Bad Gateway during transaction polling |
| 2 | [`0xfa1076448a7b116c04b970c22a35f6a172b9c268d57fe4390b4c623a26914204`](https://explorer-studio.genlayer.com/tx/0xfa1076448a7b116c04b970c22a35f6a172b9c268d57fe4390b4c623a26914204) | `ACCEPTED` | `MAJORITY_DISAGREE` | Validators disagreed on comparative equivalence; commitment remained OPEN without storage mutation |

```json
{
  "schema_version": "3.1.0",
  "commitment_id": "a1734d24cdcc",
  "registrant": "0x064AEFDaD16ECef1DD3fD3eA3D1f37629301A7c5",
  "raw_text": "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
  "subject": "apollo 11 mission",
  "action": "land human astronauts on the lunar surface before 1970",
  "deadline_hint": "1970-01-01",
  "registered_at": "2026-10-14T09:33:07Z",
  "registered_at_ts": 1791970387,
  "registered_date": "2026-10-14",
  "registration_class": "RETROSPECTIVE",
  "record_class": "HISTORICAL_ANALYSIS",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 2,
  "status": "OPEN",
  "challenge_deadline_ts": null,
  "current_decision_index": -1,
  "decisions": [],
  "outcome": null,
  "source_url": null,
  "resolution_quote": null,
  "match_confirmed": false,
  "resolved_at": null,
  "resolver": null
}
```

### Case B (Grounded Quote, BROKEN)

- **Commitment ID**: `cc4b8e0115bc`
- **Raw Text**: "Apollo 13 will successfully land on the Moon."
- **Deadline**: `1970-05-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_13
- **Register Transaction Hash**: [`0x5223bd845ce2db170af423ce1b240acf87814af9cf08d51194f3df1f61f6c018`](https://explorer-studio.genlayer.com/tx/0x5223bd845ce2db170af423ce1b240acf87814af9cf08d51194f3df1f61f6c018)
- **Resolve Transaction Hash**: [`0x4e7bc3d81505717d857e4c619e161ff1ef916120ee4f836438010b28ed8e2947`](https://explorer-studio.genlayer.com/tx/0x4e7bc3d81505717d857e4c619e161ff1ef916120ee4f836438010b28ed8e2947)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `BROKEN`
- **Evidence Preimage SHA-256**: `bf69adaf3622a301952aae2c8e1f0b534beec90a3d95ae2cfe6217c8288441b7`
- **Inspected Text SHA-256**: `53a47107476ea2f35d7d3bfae509bb772b48dcb239593991b41d1b0b2a4bdb4f`
- **Window Coverage**: `SELECTED_WINDOWS` (11066 / 99545 chars inspected, budget used: 11066 chars, segments presented: 52)

#### Adjudicated Elements

| ID | Kind | Label | Status | Cited Segment IDs |
|---|---|---|---|---|
| `e1` | `ACTION` | Apollo 13 successfully lands on the Moon | **NOT_SATISFIED** | `[7]` |
| `e2` | `DEADLINE` | completed on or before 1970-05-01 | **NOT_SATISFIED** | `[7]` |

```json
{
  "schema_version": "3.1.0",
  "commitment_id": "cc4b8e0115bc",
  "registrant": "0x5605C831F20b024143210AAC3AdDA5d9d423463F",
  "raw_text": "Apollo 13 will successfully land on the Moon.",
  "subject": "apollo 13",
  "action": "land on the moon",
  "deadline_hint": "1970-05-01",
  "registered_at": "2026-10-14T09:34:10Z",
  "registered_at_ts": 1791970450,
  "registered_date": "2026-10-14",
  "registration_class": "RETROSPECTIVE",
  "record_class": "HISTORICAL_ANALYSIS",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 3,
  "status": "PROVISIONAL",
  "challenge_deadline_ts": 1791971124,
  "current_decision_index": 0,
  "decisions": [
    {
      "n": 1,
      "kind": "INITIAL",
      "challenge_reason": null,
      "resolver": "0xAf01e753bF2f9fAf4569b9fA3761019fAe654e1c",
      "decided_at": "2026-10-14T09:35:24Z",
      "decided_at_ts": 1791970524,
      "source_url": "https://en.wikipedia.org/wiki/Apollo_13",
      "outcome": "BROKEN",
      "elements": [
        {
          "id": "e1",
          "kind": "ACTION",
          "label": "Apollo 13 successfully lands on the Moon",
          "status": "NOT_SATISFIED",
          "passage_ids": [
            7
          ]
        },
        {
          "id": "e2",
          "kind": "DEADLINE",
          "label": "completed on or before 1970-05-01",
          "status": "NOT_SATISFIED",
          "passage_ids": [
            7
          ]
        }
      ],
      "passages": [
        {
          "id": 7,
          "text": "The craft was launched from Kennedy Space Center on April 11, 1970, but the landing was aborted after an oxygen tank in the service module (SM) exploded two days into the mission, disabling its electrical and life-support system.",
          "sha256": "e4d60ac15c84a2fbad5bf46626fca1ffda337706a65936d0280d09b85c4f4393"
        }
      ],
      "evidence_sha256": "bf69adaf3622a301952aae2c8e1f0b534beec90a3d95ae2cfe6217c8288441b7",
      "inspected_text_sha256": "53a47107476ea2f35d7d3bfae509bb772b48dcb239593991b41d1b0b2a4bdb4f",
      "source_chars_total": 99545,
      "source_chars_inspected": 11066,
      "coverage": "SELECTED_WINDOWS",
      "fetch_method": "web.render",
      "presented_segment_ids": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52
      ],
      "presented_segments_count": 52,
      "truncated_at": false,
      "budget_chars_used": 11066,
      "review_result": null
    }
  ],
  "outcome": "BROKEN",
  "source_url": "https://en.wikipedia.org/wiki/Apollo_13",
  "resolution_quote": "The craft was launched from Kennedy Space Center on April 11, 1970, but the landing was aborted after an oxygen tank in the service module (SM) exploded two days into the mission, disabling its electrical and life-support system.",
  "match_confirmed": true,
  "resolved_at": "2026-10-14T09:35:24Z",
  "resolver": "0xAf01e753bF2f9fAf4569b9fA3761019fAe654e1c"
}
```

### Case C (Condition Omitted in Summary, BROKEN)

- **Commitment ID**: `8e8d07e65b36`
- **Raw Text**: "Apollo 11 will put all three of its astronauts on the lunar surface before 1970."
- **Deadline**: `1970-01-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_11
- **Register Transaction Hash**: [`0x64f4447de40bcc867131e5178fbcff71d5273a8481cd7c29a78b420974b53b11`](https://explorer-studio.genlayer.com/tx/0x64f4447de40bcc867131e5178fbcff71d5273a8481cd7c29a78b420974b53b11)
- **Resolve Transaction Hash**: [`0x997a8ae403c23fe702da3e1605386adad1398dc3ef99fefa9fff3473fa791fac`](https://explorer-studio.genlayer.com/tx/0x997a8ae403c23fe702da3e1605386adad1398dc3ef99fefa9fff3473fa791fac)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `BROKEN`
- **Evidence Preimage SHA-256**: `1bcc2dd6207240808d7ea0bd8aaaedc06d59afa75c3cf90ac3ef942c7d4294de`
- **Inspected Text SHA-256**: `fddf11c947fb1551b171c7fa320745c06e1eb38ca7d888239b97ddd07f7a8706`
- **Window Coverage**: `SELECTED_WINDOWS` (11511 / 139990 chars inspected, budget used: 11511 chars, segments presented: 41)

#### Adjudicated Elements

| ID | Kind | Label | Status | Cited Segment IDs |
|---|---|---|---|---|
| `e1` | `ACTION` | Apollo 11 lands astronauts on the lunar surface | **SATISFIED** | `[4]` |
| `e2` | `CONDITION` | All three astronauts (Armstrong, Collins, Aldrin) land on the lunar surface | **NOT_SATISFIED** | `[4]` |
| `e3` | `DEADLINE` | completed on or before 1970-01-01 | **SATISFIED** | `[1]` |

```json
{
  "schema_version": "3.1.0",
  "commitment_id": "8e8d07e65b36",
  "registrant": "0xdDADa612fBeC036f257CbBd50c8eD0D5f49FB2e4",
  "raw_text": "Apollo 11 will put all three of its astronauts on the lunar surface before 1970.",
  "subject": "apollo 11",
  "action": "put three astronauts on the lunar surface before 1970",
  "deadline_hint": "1970-01-01",
  "registered_at": "2026-10-14T09:36:57Z",
  "registered_at_ts": 1791970617,
  "registered_date": "2026-10-14",
  "registration_class": "RETROSPECTIVE",
  "record_class": "HISTORICAL_ANALYSIS",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 4,
  "status": "PROVISIONAL",
  "challenge_deadline_ts": 1791971247,
  "current_decision_index": 0,
  "decisions": [
    {
      "n": 1,
      "kind": "INITIAL",
      "challenge_reason": null,
      "resolver": "0x7757909354d36dE9718640fb58c31a325e8645CA",
      "decided_at": "2026-10-14T09:37:27Z",
      "decided_at_ts": 1791970647,
      "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
      "outcome": "BROKEN",
      "elements": [
        {
          "id": "e1",
          "kind": "ACTION",
          "label": "Apollo 11 lands astronauts on the lunar surface",
          "status": "SATISFIED",
          "passage_ids": [
            4
          ]
        },
        {
          "id": "e2",
          "kind": "CONDITION",
          "label": "All three astronauts (Armstrong, Collins, Aldrin) land on the lunar surface",
          "status": "NOT_SATISFIED",
          "passage_ids": [
            4
          ]
        },
        {
          "id": "e3",
          "kind": "DEADLINE",
          "label": "completed on or before 1970-01-01",
          "status": "SATISFIED",
          "passage_ids": [
            1
          ]
        }
      ],
      "passages": [
        {
          "id": 1,
          "text": "program ← Apollo 10 Apollo 12 → Apollo 11 (July 16-24, 1969) was the American spaceflight that first landed humans on the Moon, and the fifth crewed mission of NASA's Apollo program.",
          "sha256": "978eee8496e14914e11aab44bd8660fea38ab91f4670ef0c44d6667eabf7fe82"
        },
        {
          "id": 4,
          "text": "After a three-day transit, Armstrong and Aldrin descended to the surface aboard the LM Eagle, landing in the Sea of Tranquility (Mare Tranquillitatis) on July 20 at 20:17 UTC while Collins remained in lunar orbit aboard the CM Columbia.",
          "sha256": "e2a8a826624153d845f74f2112b6adae47bbf744d3e950517b79fb259ea927d3"
        }
      ],
      "evidence_sha256": "1bcc2dd6207240808d7ea0bd8aaaedc06d59afa75c3cf90ac3ef942c7d4294de",
      "inspected_text_sha256": "fddf11c947fb1551b171c7fa320745c06e1eb38ca7d888239b97ddd07f7a8706",
      "source_chars_total": 139990,
      "source_chars_inspected": 11511,
      "coverage": "SELECTED_WINDOWS",
      "fetch_method": "web.render",
      "presented_segment_ids": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41
      ],
      "presented_segments_count": 41,
      "truncated_at": false,
      "budget_chars_used": 11511,
      "review_result": null
    }
  ],
  "outcome": "BROKEN",
  "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
  "resolution_quote": "program ← Apollo 10 Apollo 12 → Apollo 11 (July 16-24, 1969) was the American spaceflight that first landed humans on the Moon, and the fifth crewed mission of NASA's Apollo program.",
  "match_confirmed": true,
  "resolved_at": "2026-10-14T09:37:27Z",
  "resolver": "0x7757909354d36dE9718640fb58c31a325e8645CA"
}
```

### Case D (Inconclusive Revert, OPEN)

- **Commitment ID**: `acef894a328e`
- **Raw Text**: "Apollo 11 will land astronauts on the Moon before 1 July 1969."
- **Deadline**: `1969-07-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_11
- **Register Transaction Hash**: [`0xa0249e8b2742a1890e3dc7430d265e61ebb30adbeb6932439805c9b94f438f80`](https://explorer-studio.genlayer.com/tx/0xa0249e8b2742a1890e3dc7430d265e61ebb30adbeb6932439805c9b94f438f80)
- **Resolve Transaction Hash**: [`0x712bc24c671155061fb5bf2bac1062146de13c7503459c16fd2814e4a8225ee2`](https://explorer-studio.genlayer.com/tx/0x712bc24c671155061fb5bf2bac1062146de13c7503459c16fd2814e4a8225ee2)
- **Receipt Status Name**: `UNDETERMINED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `NONE (Reverted/Open)`
- **Evidence Preimage SHA-256**: `N/A`
- **Inspected Text SHA-256**: `N/A`
- **Window Coverage**: `N/A` (0 / 0 chars inspected, budget used: 0 chars, segments presented: 0)

```json
{
  "schema_version": "3.1.0",
  "commitment_id": "acef894a328e",
  "registrant": "0x037E9B45a9bFcD70D57b734e9859BFBEBa21D352",
  "raw_text": "Apollo 11 will land astronauts on the Moon before 1 July 1969.",
  "subject": "apollo 11",
  "action": "land astronauts on the moon before 1 july 1969",
  "deadline_hint": "1969-07-01",
  "registered_at": "2026-10-14T09:38:08Z",
  "registered_at_ts": 1791970688,
  "registered_date": "2026-10-14",
  "registration_class": "RETROSPECTIVE",
  "record_class": "HISTORICAL_ANALYSIS",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 5,
  "status": "OPEN",
  "challenge_deadline_ts": null,
  "current_decision_index": -1,
  "decisions": [],
  "outcome": null,
  "source_url": null,
  "resolution_quote": null,
  "match_confirmed": false,
  "resolved_at": null,
  "resolver": null
}
```

### Case PARTIAL (Mixed Elements, Disagreed / OPEN)

- **Commitment ID**: `60cd7d08c4e5`
- **Raw Text**: "The Apollo 11 mission will land astronauts on the lunar surface before 1970 and deploy an experimental laser reflector for Australia."
- **Deadline**: `1970-01-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_11
- **Register Transaction Hash**: [`0xfa0e1c4f1eb7acba0c3e41be2840a746a5fff25dcfd4e86281564026708390d7`](https://explorer-studio.genlayer.com/tx/0xfa0e1c4f1eb7acba0c3e41be2840a746a5fff25dcfd4e86281564026708390d7)
- **Resolve Transaction Hash**: [`0x996b51efd76c51f206eff9a5f2862006a4c163763a6c8dc9d3d0c5d0f25812cc`](https://explorer-studio.genlayer.com/tx/0x996b51efd76c51f206eff9a5f2862006a4c163763a6c8dc9d3d0c5d0f25812cc)
- **Receipt Status Name**: `UNDETERMINED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `NONE (Reverted/Open)`
- **Evidence Preimage SHA-256**: `N/A`
- **Inspected Text SHA-256**: `N/A`
- **Window Coverage**: `N/A` (0 / 0 chars inspected, budget used: 0 chars, segments presented: 0)

```json
{
  "schema_version": "3.1.0",
  "commitment_id": "60cd7d08c4e5",
  "registrant": "0x33889fA7FCf41a5CD5D5d06c414726EDA6ef81c7",
  "raw_text": "The Apollo 11 mission will land astronauts on the lunar surface before 1970 and deploy an experimental laser reflector for Australia.",
  "subject": "apollo 11 mission",
  "action": "land astronauts on the moon and deploy an experimental laser reflector",
  "deadline_hint": "1970-01-01",
  "registered_at": "2026-10-14T09:40:27Z",
  "registered_at_ts": 1791970827,
  "registered_date": "2026-10-14",
  "registration_class": "RETROSPECTIVE",
  "record_class": "HISTORICAL_ANALYSIS",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 6,
  "status": "OPEN",
  "challenge_deadline_ts": null,
  "current_decision_index": -1,
  "decisions": [],
  "outcome": null,
  "source_url": null,
  "resolution_quote": null,
  "match_confirmed": false,
  "resolved_at": null,
  "resolver": null
}
```

## 3. Challenge State Machine & Decisions History

Verified on-chain challenge progression exercising the bounded reconsideration state machine:

- **Commitment ID**: `b90ed8cb5cf2`
- **Register Tx**: [`0x5a272e9b482a7b5f63b4a83c2ac54f86e308d7f2436a35497e20c8ae9392733d`](https://explorer-studio.genlayer.com/tx/0x5a272e9b482a7b5f63b4a83c2ac54f86e308d7f2436a35497e20c8ae9392733d)
- **Initial Resolution Tx**: [`0xa7c88a13525b2ca32f0e52172dd8d8ed5ec96a3d50c6dbe4e53c0bd0a4b1a57b`](https://explorer-studio.genlayer.com/tx/0xa7c88a13525b2ca32f0e52172dd8d8ed5ec96a3d50c6dbe4e53c0bd0a4b1a57b)
- **Challenge 1 Tx (UNSUPPORTED_CLASSIFICATION)**: [`0xbd57c320f56349b9d316e2161b7ca3330801e472078518155c5aef9402eb880a`](https://explorer-studio.genlayer.com/tx/0xbd57c320f56349b9d316e2161b7ca3330801e472078518155c5aef9402eb880a)
- **Challenge 2 Tx (CONFLICTING_EVIDENCE)**: [`0x2825907ab12db9a694b1a9b2ed52aa5fa3959677c3d8df6ba1f80a74f7e6207f`](https://explorer-studio.genlayer.com/tx/0x2825907ab12db9a694b1a9b2ed52aa5fa3959677c3d8df6ba1f80a74f7e6207f)
- **Finalize Tx**: [`0x2c250713a3341c65198d8821f04352c50f31d9858942df0a8540a974abf484fe`](https://explorer-studio.genlayer.com/tx/0x2c250713a3341c65198d8821f04352c50f31d9858942df0a8540a974abf484fe)
- **Final Record Status**: `FINAL`
- **Total Decisions In History**: `3`

### Decisions Timeline

| Decision # | Kind | Reason | Outcome | Source URL | Fingerprint |
|---|---|---|---|---|---|
| 1 | `INITIAL` | `N/A` | **KEPT** | https://en.wikipedia.org/wiki/Apollo_11 | `0e8ad66843fc8983...` |
| 2 | `CHALLENGE` | `UNSUPPORTED_CLASSIFICATION` | **KEPT** | https://en.wikipedia.org/wiki/Apollo_11 | `0e8ad66843fc8983...` |
| 3 | `CHALLENGE` | `CONFLICTING_EVIDENCE` | **KEPT** | https://en.wikipedia.org/wiki/Apollo_program | `6b47f74dfa48d87f...` |

## 4. On-Chain Negative Rejection Tests

Every negative test below was verified on GenLayer Studionet by querying JSON-RPC `eth_getTransactionByHash` and decoding base64 field `result.consensus_data.leader_receipt[0].result`:

### neg_retrospective_no_ack

- **Transaction Hash**: [`0xdf80eda2aab5778d3c2031f95aaaa288896b9ccb8c08fc548a07c8592dc827c2`](https://explorer-studio.genlayer.com/tx/0xdf80eda2aab5778d3c2031f95aaaa288896b9ccb8c08fc548a07c8592dc827c2)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"deadline is not after registration date; set retrospective_ack to record a historical claim"`

### neg_invalid_claim_kind

- **Transaction Hash**: [`0x5d27f8511d242393e92001d86ebfe1d5f9b671c8db19019a9dae3f698a1c07c1`](https://explorer-studio.genlayer.com/tx/0x5d27f8511d242393e92001d86ebfe1d5f9b671c8db19019a9dae3f698a1c07c1)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT"`

### neg_premature_resolution

- **Target Commitment ID**: `15c567e44858`
- **Transaction Hash**: [`0x409553629451d66a6c8c8e26185ed13617187f79d8c7aada45231b64121bd95c`](https://explorer-studio.genlayer.com/tx/0x409553629451d66a6c8c8e26185ed13617187f79d8c7aada45231b64121bd95c)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"cannot resolve before deadline date"`

### neg_nomatch_distractor

- **Submitted Parameter (URL)**: `https://en.wikipedia.org/wiki/Falcon_9`
- **Target Commitment ID**: `aa48f690c1a7`
- **Transaction Hash**: [`0x9d5b07945b904f14d0488c81bf0bd5f792a86b4f81c3989ec02479a683017bf7`](https://explorer-studio.genlayer.com/tx/0x9d5b07945b904f14d0488c81bf0bd5f792a86b4f81c3989ec02479a683017bf7)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"source does not match this commitment"`

### neg_disallowed_domain

- **Submitted Parameter (URL)**: `https://raw.githubusercontent.com/test`
- **Target Commitment ID**: `aa48f690c1a7`
- **Transaction Hash**: [`0xa599c6963a5a1ae804e9b555c90f641ae5ce110187513c72b876076516f41f86`](https://explorer-studio.genlayer.com/tx/0xa599c6963a5a1ae804e9b555c90f641ae5ce110187513c72b876076516f41f86)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"source_url domain not in authorized allowlist"`

### neg_challenge_while_open

- **Target Commitment ID**: `15c567e44858`
- **Transaction Hash**: [`0x5b27ecd774aefabe1d255f2a75a036561be2ce149ec34158b483cff98238f87b`](https://explorer-studio.genlayer.com/tx/0x5b27ecd774aefabe1d255f2a75a036561be2ce149ec34158b483cff98238f87b)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"commitment is not in provisional status"`

### neg_finalize_while_open

- **Target Commitment ID**: `15c567e44858`
- **Transaction Hash**: [`0xa9af7835af5864a4275dcb630500edbdee683cddf73223549011777aef6e2325`](https://explorer-studio.genlayer.com/tx/0xa9af7835af5864a4275dcb630500edbdee683cddf73223549011777aef6e2325)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"commitment is not in provisional status"`

### neg_early_finalize

- **Target Commitment ID**: `b90ed8cb5cf2`
- **Transaction Hash**: [`0xf8821f8a38b84c671b4e2e92655ac4bc1c672f15e4def544763ccf777e8c7083`](https://explorer-studio.genlayer.com/tx/0xf8821f8a38b84c671b4e2e92655ac4bc1c672f15e4def544763ccf777e8c7083)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"challenge window still open"`

## 5. Consensus Measurements & Validator Agreement Rates

Empirical validator telemetry captured during test execution:

| Operation | Tx Hash | Receipt Status | Consensus Result | Execution | Latency (s) | Agreement Rate |
|---|---|---|---|---|---|---|
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

## 6. Features Covered Exclusively in Pure/Mock Unit Tests

The following contract safeguards are rigorously verified via `tests/test_layer1_pure.py` and `tests/test_layer2_mocked.py`, but are intentionally not triggered on-chain to conserve studionet funds and avoid validator spam:

1. **Elements Bounds Enforcement**: Validation rejecting models that output fewer than 2 elements or more than 6 elements (`len(elements) > 6`).
2. **Strict Regex Calendar Date Parser**: Full date format validation rejecting malformed expressions (e.g. leap year invalid dates, non-numeric months, trailing whitespace).
3. **Exhaustive Element-to-Outcome Matrix**: All 14 combinatoric branches between ACTION, CONDITION, and DEADLINE satisfaction.
4. **Strict JSON Parser Resiliency**: Parser rejection of corrupted LLM payloads, non-object JSON roots, markdown fence stripping edge cases, and control character injections.
5. **Challenge Decision Cap**: Rejection of a 4th challenge when `MAX_DECISIONS = 3` is already reached.
6. **Deterministic Sentence Segmentation**: Segmentation boundary handling for decimal points, honorific abbreviations (Dr., Gen.), and sentence length capping at 240 characters.

