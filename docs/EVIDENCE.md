# On-Chain Evidence: CommitmentLedger v3.0.0

This document records the exact, verified on-chain evidence transactions executed on GenLayer Studionet (Preview) for contract `0xdD0d120B50ED65400E8b6a060bB15103B42544E8`.

- **Active Contract Address**: [`0xdD0d120B50ED65400E8b6a060bB15103B42544E8`](https://explorer-studio.genlayer.com/address/0xdD0d120B50ED65400E8b6a060bB15103B42544E8)
- **Deploy Transaction Hash**: [`0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467`](https://explorer-studio.genlayer.com/tx/0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467)
- **Phase 1 Execution Completed**: `2026-10-14T05:38:53.730Z`
- **Phase 2 Pending Maturity Date**: `2026-10-16`

## 1. Prospective Registration (Phase 1 Recorded, Phase 2 Pending)

### Case P1 (Prospective Registration, OPEN)

- **Commitment ID**: `3d2cc5901dad`
- **Statement**: "SpaceX will launch the USSF-481 mission for the United States Space Force from Vandenberg on or before 2026-10-16."
- **Deadline**: `2026-10-16`
- **Target Source URL**: https://en.wikipedia.org/wiki/List_of_spaceflight_launches_in_October%E2%80%93December_2026
- **Registration Transaction**: [`0x30883fec9e9135929dccc73857b461358606c74c6870ebc274562379c5c6382c`](https://explorer-studio.genlayer.com/tx/0x30883fec9e9135929dccc73857b461358606c74c6870ebc274562379c5c6382c)
- **Receipt Status**: `ACCEPTED`
- **Leader Execution**: `SUCCESS`
- **Record Status**: `OPEN`
- **Temporal Classification**: `undefined`
- **Record Class**: `ACCOUNTABILITY`
- **Claim Kind**: `THIRD_PARTY_REPORT`

```json
{
  "schema_version": "3.0.0",
  "commitment_id": "3d2cc5901dad",
  "registrant": "0x4D26d49b3bc6ae15BF3193DD0583B1c100Fc752D",
  "raw_text": "SpaceX will launch the USSF-481 mission for the United States Space Force from Vandenberg on or before 2026-10-16.",
  "subject": "spacex",
  "action": "launch ussf-481 mission for us space force from vandenberg by 2026-10-16",
  "deadline_hint": "2026-10-16",
  "registered_at": "2026-10-14T05:37:48.571102Z",
  "registered_at_ts": 1791956268,
  "registered_date": "2026-10-14",
  "registration_class": "PROSPECTIVE",
  "record_class": "ACCOUNTABILITY",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 3,
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

### Case A (Paraphrased Source, KEPT)

- **Commitment ID**: `d569fda4e876`
- **Raw Text**: "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970."
- **Deadline**: `1970-01-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_11
- **Register Transaction Hash**: [`0x6899aa4400c42c606b80a570deceec0105179c83dd2e783eae11202ef81eab38`](https://explorer-studio.genlayer.com/tx/0x6899aa4400c42c606b80a570deceec0105179c83dd2e783eae11202ef81eab38)
- **Resolve Transaction Hash**: [`0xd379123921e3f89d9e360ca8c7913d748c82f58f897cf08dd6b1490588eb449f`](https://explorer-studio.genlayer.com/tx/0xd379123921e3f89d9e360ca8c7913d748c82f58f897cf08dd6b1490588eb449f)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `KEPT`
- **Evidence Preimage SHA-256**: `None`
- **Inspected Text SHA-256**: `None`
- **Window Coverage**: `COMPLETE` (0 / 0 chars inspected)

```json
{
  "schema_version": "3.0.0",
  "commitment_id": "d569fda4e876",
  "registrant": "0x7fb3a58De9cff2D28B70459C3CE0Db6a9354adB1",
  "raw_text": "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
  "subject": "apollo 11 mission",
  "action": "land human astronauts on the lunar surface before 1970",
  "deadline_hint": "1970-01-01",
  "registered_at": "2026-10-14T05:38:13.301136Z",
  "registered_at_ts": 1791956293,
  "registered_date": "2026-10-14",
  "registration_class": "RETROSPECTIVE",
  "record_class": "HISTORICAL_ANALYSIS",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 4,
  "status": "PROVISIONAL",
  "challenge_deadline_ts": 1791956923,
  "current_decision_index": 0,
  "decisions": [
    {
      "n": 1,
      "kind": "INITIAL",
      "challenge_reason": null,
      "resolver": "0x9582ac1FA9DEDb054aba31f596CAADfed85C902F",
      "decided_at": "2026-10-14T05:38:43.267011Z",
      "decided_at_ts": 1791956323,
      "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
      "outcome": "KEPT",
      "elements": [
        {
          "id": "e1",
          "kind": "ACTION",
          "label": "Land human astronauts on the lunar surface",
          "status": "SATISFIED",
          "passage_ids": [
            6,
            10,
            16
          ]
        },
        {
          "id": "e2",
          "kind": "CONDITION",
          "label": "United States Apollo 11 mission",
          "status": "SATISFIED",
          "passage_ids": [
            11,
            13
          ]
        },
        {
          "id": "e3",
          "kind": "DEADLINE",
          "label": "completed before 1970-01-01",
          "status": "SATISFIED",
          "passage_ids": [
            10
          ]
        }
      ],
      "passages": [
        {
          "id": 6,
          "text": "Armstrong (left) and Aldrin (right) are seated, while Collins stands behind them at center.",
          "sha256": "d9005ac530fcd00d3f21e4d5c8509558dcbb8c52305a8a8877b112179b1a5f1f"
        },
        {
          "id": 10,
          "text": "After more than 21 hours on the surface, they rejoined Collins in lunar orbit, and the crew returned safely to <a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/Earth\" title=\"Earth\" id=\"mwiA\">Earth</a> on July 24, splashing down in t",
          "sha256": "a1144382583214587c81bb8232a3d87f707888771d6d7e3ef6742dc2a5ed55be"
        },
        {
          "id": 11,
          "text": "It fulfilled a national goal set by President <a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/John_F._Kennedy\" title=\"John F.",
          "sha256": "69e6c05bccf0cba34da025bb94482bd12f1aeca4b850e620e07e5072edbd4951"
        },
        {
          "id": 13,
          "text": "Kennedy</a> in May 1961, who had <a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/We_choose_to_go_to_the_Moon\" title=\"We choose to go to the Moon\" id=\"mwjw\">challenged</a> the United States to land a man on the Moon and return him s",
          "sha256": "4c2266bb7dd4d07873cf5b09292b49585ace979d88d1d53934342b03e3559df6"
        },
        {
          "id": 16,
          "text": "Stepping onto the lunar surface, Armstrong declared: \"<a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/One_small_step\" title=\"One small step\" id=\"mwlg\">That's one small step for [a] man, one giant leap for mankind</a>.\" <a rel=\"mw:W",
          "sha256": "22a7ec6edb90d6d57ba772bf09b5b9cc405983ab7c71416695fb96ffef535613"
        }
      ],
      "evidence_sha256": "91620183b17734c914d9308e61097e4e8d0b1c883bcd6d236a37c9a8b38e2c5b",
      "inspected_text_sha256": "67814660365d0a7ece3a0c32ffd657217f357eccfe68dfd0124d7d3379d41317",
      "source_chars_total": 1429862,
      "source_chars_inspected": 12021,
      "coverage": "SELECTED_WINDOWS",
      "fetch_method": "web.get",
      "review_result": null
    }
  ],
  "outcome": "KEPT",
  "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
  "resolution_quote": "Armstrong (left) and Aldrin (right) are seated, while Collins stands behind them at center.",
  "match_confirmed": true,
  "resolved_at": "2026-10-14T05:38:43.267011Z",
  "resolver": "0x9582ac1FA9DEDb054aba31f596CAADfed85C902F"
}
```

### Case B (Grounded Quote, BROKEN)

- **Commitment ID**: `9875a6cdef6d`
- **Raw Text**: "Apollo 13 will successfully land on the Moon."
- **Deadline**: `1970-05-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_13
- **Register Transaction Hash**: [`0xf2ce034fcf4b7b8598330d81944b7f315a18024cc44e64882b872096a1cdbf5a`](https://explorer-studio.genlayer.com/tx/0xf2ce034fcf4b7b8598330d81944b7f315a18024cc44e64882b872096a1cdbf5a)
- **Resolve Transaction Hash**: [`0x0684f543bf5e95f6f1656150a03ca8fa2dbb7409d74e7bfbf3559347a973acbc`](https://explorer-studio.genlayer.com/tx/0x0684f543bf5e95f6f1656150a03ca8fa2dbb7409d74e7bfbf3559347a973acbc)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `BROKEN`
- **Evidence Preimage SHA-256**: `None`
- **Inspected Text SHA-256**: `None`
- **Window Coverage**: `COMPLETE` (0 / 0 chars inspected)

```json
{
  "schema_version": "3.0.0",
  "commitment_id": "9875a6cdef6d",
  "registrant": "0x29a0DB00610bB71abDc98880f9f9888a948FE0Ff",
  "raw_text": "Apollo 13 will successfully land on the Moon.",
  "subject": "apollo 13",
  "action": "successfully land on the moon",
  "deadline_hint": "1970-05-01",
  "registered_at": "2026-10-14T05:39:03.768826Z",
  "registered_at_ts": 1791956343,
  "registered_date": "2026-10-14",
  "registration_class": "RETROSPECTIVE",
  "record_class": "HISTORICAL_ANALYSIS",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 5,
  "status": "PROVISIONAL",
  "challenge_deadline_ts": 1791956960,
  "current_decision_index": 0,
  "decisions": [
    {
      "n": 1,
      "kind": "INITIAL",
      "challenge_reason": null,
      "resolver": "0xbc3b1B9608dd74B705E3b0056872D9c79c4D3F61",
      "decided_at": "2026-10-14T05:39:20.608016Z",
      "decided_at_ts": 1791956360,
      "source_url": "https://en.wikipedia.org/wiki/Apollo_13",
      "outcome": "BROKEN",
      "elements": [
        {
          "id": "e1",
          "kind": "ACTION",
          "label": "Apollo 13 will successfully land on the Moon",
          "status": "NOT_SATISFIED",
          "passage_ids": [
            2
          ]
        },
        {
          "id": "e2",
          "kind": "DEADLINE",
          "label": "completed on or before 1970-05-01",
          "status": "NOT_SATISFIED",
          "passage_ids": [
            4
          ]
        }
      ],
      "passages": [
        {
          "id": 2,
          "text": "For the film based upon it, see <a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/Apollo_13_(film)\" title=\"Apollo 13 (film)\"><i>Apollo 13</i> (film)</a>.",
          "sha256": "b119269e59a6781d352c5ce9b3d441ca001221714dce44bf5c39d6dfb5e1117b"
        },
        {
          "id": 4,
          "text": "Click here for more information.]]\\n\"}}'/><link rel=\"mw:PageProp/Category\" href=\"./Category:Featured_articles\" about=\"#mwt4\" id=\"mwCA\"/> <span typeof=\"mw:Nowiki mw:Transclusion\" about=\"#mwt6\" i [...] uary 17, 2025 |url-status=dead}}&lt;/ref",
          "sha256": "c02df47055b9b5459133b619b58883ee75e1306caa536cf61f7ed3e4bae4b893"
        }
      ],
      "evidence_sha256": "2a1ea5b82777817019b3468b915cd3edaafa345061622419456c08fbc1241b1b",
      "inspected_text_sha256": "c5b4f9f0db5c81db207f7b63c28005d77d77c2d0becf6e3d1968f705e5933d8c",
      "source_chars_total": 1034490,
      "source_chars_inspected": 12021,
      "coverage": "SELECTED_WINDOWS",
      "fetch_method": "web.get",
      "review_result": null
    }
  ],
  "outcome": "BROKEN",
  "source_url": "https://en.wikipedia.org/wiki/Apollo_13",
  "resolution_quote": "For the film based upon it, see <a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/Apollo_13_(film)\" title=\"Apollo 13 (film)\"><i>Apollo 13</i> (film)</a>.",
  "match_confirmed": true,
  "resolved_at": "2026-10-14T05:39:20.608016Z",
  "resolver": "0xbc3b1B9608dd74B705E3b0056872D9c79c4D3F61"
}
```

### Case C (Condition Omitted in Summary, BROKEN)

- **Commitment ID**: `ec77538d32e9`
- **Raw Text**: "Apollo 11 will put all three of its astronauts on the lunar surface before 1970."
- **Deadline**: `1970-01-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_11
- **Register Transaction Hash**: [`0x0b7176db894ee47fb8805667d4d1a38ddce4b3c4917f09a4c735b2e59eb524d2`](https://explorer-studio.genlayer.com/tx/0x0b7176db894ee47fb8805667d4d1a38ddce4b3c4917f09a4c735b2e59eb524d2)
- **Resolve Transaction Hash**: [`0x724098f2fa4c497274c3c29ab60083eed8012adf7866a45b8af36356d72081b5`](https://explorer-studio.genlayer.com/tx/0x724098f2fa4c497274c3c29ab60083eed8012adf7866a45b8af36356d72081b5)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `BROKEN`
- **Evidence Preimage SHA-256**: `None`
- **Inspected Text SHA-256**: `None`
- **Window Coverage**: `COMPLETE` (0 / 0 chars inspected)

```json
{
  "schema_version": "3.0.0",
  "commitment_id": "ec77538d32e9",
  "registrant": "0xcc9EBEcDAff19AA71bD43Bcf4BAAd589A02639e0",
  "raw_text": "Apollo 11 will put all three of its astronauts on the lunar surface before 1970.",
  "subject": "apollo 11",
  "action": "land all three astronauts on the lunar surface before 1970",
  "deadline_hint": "1970-01-01",
  "registered_at": "2026-10-14T05:41:28.208647Z",
  "registered_at_ts": 1791956488,
  "registered_date": "2026-10-14",
  "registration_class": "RETROSPECTIVE",
  "record_class": "HISTORICAL_ANALYSIS",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 6,
  "status": "PROVISIONAL",
  "challenge_deadline_ts": 1791957111,
  "current_decision_index": 0,
  "decisions": [
    {
      "n": 1,
      "kind": "INITIAL",
      "challenge_reason": null,
      "resolver": "0x6D211C25a221d6e407CA02B6b4925a829409BF68",
      "decided_at": "2026-10-14T05:41:51.467118Z",
      "decided_at_ts": 1791956511,
      "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
      "outcome": "BROKEN",
      "elements": [
        {
          "id": "e1",
          "kind": "ACTION",
          "label": "Apollo 11 puts astronauts on the lunar surface",
          "status": "SATISFIED",
          "passage_ids": [
            5
          ]
        },
        {
          "id": "e2",
          "kind": "CONDITION",
          "label": "all three of its astronauts are on the lunar surface",
          "status": "NOT_SATISFIED",
          "passage_ids": [
            8
          ]
        },
        {
          "id": "e3",
          "kind": "DEADLINE",
          "label": "completed on or before 1970-01-01",
          "status": "NOT_SATISFIED",
          "passage_ids": [
            9
          ]
        }
      ],
      "passages": [
        {
          "id": 5,
          "text": "After a three-day transit, Armstrong and Aldrin descended to the surface aboard the LM <i id=\"mwfg\"><a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/Apollo_Lunar_Module_Eagle\" title=\"Apollo Lunar Module Eagle\" class=\"mw-redirect\" id",
          "sha256": "08ab650812f27c5e781d88303a25dddc75e7d9b8d6b5b53f6f39413834e9928c"
        },
        {
          "id": 8,
          "text": "After more than 21 hours on the surface, they rejoined Collins in lunar orbit, and the crew returned safely to <a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/Earth\" title=\"Earth\" id=\"mwiA\">Earth</a>  [...] the <a rel=\"mw:WikiLink\"",
          "sha256": "706a6426f2c1d321990a3024277f6c6e5a6523d1e18eb8ad456576a509ace743"
        },
        {
          "id": 9,
          "text": "After more than 21 hours on the surface, they rejoined Collins in lunar orbit, and the crew returned safely to <a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/Earth\" title=\"Earth\" id=\"mwiA\">Earth</a> on July 24, splashing down in t",
          "sha256": "a1144382583214587c81bb8232a3d87f707888771d6d7e3ef6742dc2a5ed55be"
        }
      ],
      "evidence_sha256": "c74f2fa9955519189661fad75f77a37cc62a14cd9a2203d5af22f39ea3e02497",
      "inspected_text_sha256": "799a32b079859ea326dc8842ae3160bb6af8c4535c3b3e0a5d1bd6ac9dca1b6b",
      "source_chars_total": 1429862,
      "source_chars_inspected": 12021,
      "coverage": "SELECTED_WINDOWS",
      "fetch_method": "web.get",
      "review_result": null
    }
  ],
  "outcome": "BROKEN",
  "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
  "resolution_quote": "After a three-day transit, Armstrong and Aldrin descended to the surface aboard the LM <i id=\"mwfg\"><a rel=\"mw:WikiLink\" href=\"https://en.wikipedia.org/wiki/Apollo_Lunar_Module_Eagle\" title=\"Apollo Lunar Module Eagle\" class=\"mw-redirect\" id",
  "match_confirmed": true,
  "resolved_at": "2026-10-14T05:41:51.467118Z",
  "resolver": "0x6D211C25a221d6e407CA02B6b4925a829409BF68"
}
```

### Case D (Missed Deadline, Inconclusive Revert, OPEN)

- **Commitment ID**: `a0d3d1ba6356`
- **Raw Text**: "Apollo 11 will land astronauts on the Moon before 1 July 1969."
- **Deadline**: `1969-07-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_11
- **Register Transaction Hash**: [`0x019162a6722dbfe94c96050be14ecd773fa8ca8026175f508f668416107e146b`](https://explorer-studio.genlayer.com/tx/0x019162a6722dbfe94c96050be14ecd773fa8ca8026175f508f668416107e146b)
- **Resolve Transaction Hash**: [`0xbfd05f848dd5bf898b9089a877f37edbb4a179fbc971884c5e752f04bec9e177`](https://explorer-studio.genlayer.com/tx/0xbfd05f848dd5bf898b9089a877f37edbb4a179fbc971884c5e752f04bec9e177)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Recorded Outcome**: `null`
- **Evidence Preimage SHA-256**: `None`
- **Inspected Text SHA-256**: `None`
- **Window Coverage**: `COMPLETE` (0 / 0 chars inspected)

```json
{
  "schema_version": "3.0.0",
  "commitment_id": "a0d3d1ba6356",
  "registrant": "0x833ebe7922a32b1fCA4e36D7fdECf794BF39717c",
  "raw_text": "Apollo 11 will land astronauts on the Moon before 1 July 1969.",
  "subject": "apollo 11",
  "action": "land astronauts on the moon before july 1969",
  "deadline_hint": "1969-07-01",
  "registered_at": "2026-10-14T05:42:54.621818Z",
  "registered_at_ts": 1791956574,
  "registered_date": "2026-10-14",
  "registration_class": "RETROSPECTIVE",
  "record_class": "HISTORICAL_ANALYSIS",
  "claim_kind": "THIRD_PARTY_REPORT",
  "identity_verified": false,
  "created_round": 7,
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

- **Commitment ID**: `7a681e3ba0a4`
- **Register Tx**: [`0x346a956c5fe359f299ec5a34cdff42e9e8507d2c597070e557cd9de2f278b70c`](https://explorer-studio.genlayer.com/tx/0x346a956c5fe359f299ec5a34cdff42e9e8507d2c597070e557cd9de2f278b70c)
- **Initial Resolution Tx**: [`0x575654d453a323b23676c9e1b0d7dde251e752e132dcea7d285aaaf904a2e778`](https://explorer-studio.genlayer.com/tx/0x575654d453a323b23676c9e1b0d7dde251e752e132dcea7d285aaaf904a2e778)
- **Challenge 1 Tx (UNSUPPORTED_CLASSIFICATION)**: [`0x137dda2a6d1770410dfd93dd7ef0e6e3d850bd19ed12a6b82bf831a4dc6baff8`](https://explorer-studio.genlayer.com/tx/0x137dda2a6d1770410dfd93dd7ef0e6e3d850bd19ed12a6b82bf831a4dc6baff8)
- **Challenge 2 Tx (CONFLICTING_EVIDENCE)**: [`0xf300bfa0030992528147e7c4de81c61ad8a933bd4d5f8eb5afe3e423ea108712`](https://explorer-studio.genlayer.com/tx/0xf300bfa0030992528147e7c4de81c61ad8a933bd4d5f8eb5afe3e423ea108712)
- **Finalize Tx**: [`0x3f1092895b00e03365123e70f5e24851ae93fd87dc2a65aa4ceeefa4054b061c`](https://explorer-studio.genlayer.com/tx/0x3f1092895b00e03365123e70f5e24851ae93fd87dc2a65aa4ceeefa4054b061c)
- **Final Record Status**: `OPEN`
- **Total Decisions In History**: `2`

### Decisions Timeline

| Decision # | Kind | Reason | Outcome | Source URL | Fingerprint |
|---|---|---|---|---|---|
| 1 | `INITIAL` | `N/A` | **KEPT** | https://en.wikipedia.org/wiki/Apollo_11 | `8d8e8c931eb48ef5...` |
| 2 | `CHALLENGE` | `UNSUPPORTED_CLASSIFICATION` | **N/A** | https://en.wikipedia.org/wiki/Apollo_11 | `None` |

## 4. On-Chain Negative Rejection Tests

Every negative test below was verified on GenLayer Studionet by querying JSON-RPC `eth_getTransactionByHash` and decoding base64 field `result.consensus_data.leader_receipt[0].result`:

### neg_retrospective_no_ack

- **Transaction Hash**: [`0xa025fb40394d752a2bf3f79cf0e66d7755daecf8daf8f2b530f001964e41db72`](https://explorer-studio.genlayer.com/tx/0xa025fb40394d752a2bf3f79cf0e66d7755daecf8daf8f2b530f001964e41db72)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"deadline is not after registration date; set retrospective_ack to record a historical claim"`

### neg_invalid_claim_kind

- **Transaction Hash**: [`0xd565b19a8a3f2c453b146d7399741655cbe54be11cc5ccb8b248d9777f0b5bf4`](https://explorer-studio.genlayer.com/tx/0xd565b19a8a3f2c453b146d7399741655cbe54be11cc5ccb8b248d9777f0b5bf4)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"claim_kind must be SELF_DECLARED or THIRD_PARTY_REPORT"`

### neg_premature_resolution

- **Target Commitment ID**: `3d2cc5901dad`
- **Transaction Hash**: [`0x4b210b3ab195d8765ece9e8b0ac0bd9f9ed7bc8fc3606bc7c5bc71ec6cd9171e`](https://explorer-studio.genlayer.com/tx/0x4b210b3ab195d8765ece9e8b0ac0bd9f9ed7bc8fc3606bc7c5bc71ec6cd9171e)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"cannot resolve before deadline date"`

### neg_nomatch_distractor

- **Submitted Parameter (URL)**: `https://en.wikipedia.org/wiki/Falcon_9`
- **Target Commitment ID**: `7a0e71c4ee42`
- **Transaction Hash**: [`0x1d4132b76b6a33f156ea4f66efd32015ea04612cf754666c3b349d89d11e2011`](https://explorer-studio.genlayer.com/tx/0x1d4132b76b6a33f156ea4f66efd32015ea04612cf754666c3b349d89d11e2011)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"source does not match this commitment"`

### neg_disallowed_domain

- **Submitted Parameter (URL)**: `https://raw.githubusercontent.com/test`
- **Target Commitment ID**: `7a0e71c4ee42`
- **Transaction Hash**: [`0xe9a3457e57ff0da66c9fe7a0e569c489c05e6b00cda0bea8f2b98be45376f4a3`](https://explorer-studio.genlayer.com/tx/0xe9a3457e57ff0da66c9fe7a0e569c489c05e6b00cda0bea8f2b98be45376f4a3)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"source_url domain not in authorized allowlist"`

### neg_challenge_while_open

- **Target Commitment ID**: `3d2cc5901dad`
- **Transaction Hash**: [`0xb56ab310f04b61d9d9b10ad5d8b1d51252880eb250dec912300af265f7e6d3e4`](https://explorer-studio.genlayer.com/tx/0xb56ab310f04b61d9d9b10ad5d8b1d51252880eb250dec912300af265f7e6d3e4)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"commitment is not in provisional status"`

### neg_finalize_while_open

- **Target Commitment ID**: `3d2cc5901dad`
- **Transaction Hash**: [`0x73acc08da9391f0597ef8f27c8911bce5772bf713e141f0a88a45146a3bd8ced`](https://explorer-studio.genlayer.com/tx/0x73acc08da9391f0597ef8f27c8911bce5772bf713e141f0a88a45146a3bd8ced)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"commitment is not in provisional status"`

### neg_early_finalize

- **Target Commitment ID**: `7a681e3ba0a4`
- **Transaction Hash**: [`0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd`](https://explorer-studio.genlayer.com/tx/0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"challenge window still open"`

## 5. Consensus Measurements & Validator Agreement Rates

Empirical validator telemetry captured during test execution:

| Operation | Tx Hash | Receipt Status | Consensus Result | Execution | Latency (s) | Agreement Rate |
|---|---|---|---|---|---|---|
| `register_commitment` | [`0x30883fec9e9135929dccc73857b461358606c74c6870ebc274562379c5c6382c`](https://explorer-studio.genlayer.com/tx/0x30883fec9e9135929dccc73857b461358606c74c6870ebc274562379c5c6382c) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 22.04s | **60.0%** (3/5) |
| `register_commitment` | [`0x6899aa4400c42c606b80a570deceec0105179c83dd2e783eae11202ef81eab38`](https://explorer-studio.genlayer.com/tx/0x6899aa4400c42c606b80a570deceec0105179c83dd2e783eae11202ef81eab38) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 28.42s | **60.0%** (3/5) |
| `submit_resolution` | [`0xd379123921e3f89d9e360ca8c7913d748c82f58f897cf08dd6b1490588eb449f`](https://explorer-studio.genlayer.com/tx/0xd379123921e3f89d9e360ca8c7913d748c82f58f897cf08dd6b1490588eb449f) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 18.55s | **60.0%** (3/5) |
| `register_commitment` | [`0xf2ce034fcf4b7b8598330d81944b7f315a18024cc44e64882b872096a1cdbf5a`](https://explorer-studio.genlayer.com/tx/0xf2ce034fcf4b7b8598330d81944b7f315a18024cc44e64882b872096a1cdbf5a) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 15.25s | **60.0%** (3/5) |
| `submit_resolution` | [`0x0684f543bf5e95f6f1656150a03ca8fa2dbb7409d74e7bfbf3559347a973acbc`](https://explorer-studio.genlayer.com/tx/0x0684f543bf5e95f6f1656150a03ca8fa2dbb7409d74e7bfbf3559347a973acbc) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 125.96s | **60.0%** (3/5) |
| `register_commitment` | [`0x0b7176db894ee47fb8805667d4d1a38ddce4b3c4917f09a4c735b2e59eb524d2`](https://explorer-studio.genlayer.com/tx/0x0b7176db894ee47fb8805667d4d1a38ddce4b3c4917f09a4c735b2e59eb524d2) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 21.6s | **60.0%** (3/5) |
| `submit_resolution` | [`0x724098f2fa4c497274c3c29ab60083eed8012adf7866a45b8af36356d72081b5`](https://explorer-studio.genlayer.com/tx/0x724098f2fa4c497274c3c29ab60083eed8012adf7866a45b8af36356d72081b5) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 61.47s | **60.0%** (3/5) |
| `register_commitment` | [`0x019162a6722dbfe94c96050be14ecd773fa8ca8026175f508f668416107e146b`](https://explorer-studio.genlayer.com/tx/0x019162a6722dbfe94c96050be14ecd773fa8ca8026175f508f668416107e146b) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 15.16s | **60.0%** (3/5) |
| `submit_resolution` | [`0xbfd05f848dd5bf898b9089a877f37edbb4a179fbc971884c5e752f04bec9e177`](https://explorer-studio.genlayer.com/tx/0xbfd05f848dd5bf898b9089a877f37edbb4a179fbc971884c5e752f04bec9e177) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 71.46s | **60.0%** (3/5) |
| `register_commitment` | [`0xa025fb40394d752a2bf3f79cf0e66d7755daecf8daf8f2b530f001964e41db72`](https://explorer-studio.genlayer.com/tx/0xa025fb40394d752a2bf3f79cf0e66d7755daecf8daf8f2b530f001964e41db72) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.56s | **60.0%** (3/5) |
| `register_commitment` | [`0xd565b19a8a3f2c453b146d7399741655cbe54be11cc5ccb8b248d9777f0b5bf4`](https://explorer-studio.genlayer.com/tx/0xd565b19a8a3f2c453b146d7399741655cbe54be11cc5ccb8b248d9777f0b5bf4) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.43s | **100.0%** (5/5) |
| `submit_resolution` | [`0x4b210b3ab195d8765ece9e8b0ac0bd9f9ed7bc8fc3606bc7c5bc71ec6cd9171e`](https://explorer-studio.genlayer.com/tx/0x4b210b3ab195d8765ece9e8b0ac0bd9f9ed7bc8fc3606bc7c5bc71ec6cd9171e) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 5.1s | **60.0%** (3/5) |
| `register_commitment` | [`0x691c6d9960c42cf6bfb1f115eede6fd6470e620e712303d42f3504c3f2a21f80`](https://explorer-studio.genlayer.com/tx/0x691c6d9960c42cf6bfb1f115eede6fd6470e620e712303d42f3504c3f2a21f80) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 18.44s | **60.0%** (3/5) |
| `submit_resolution` | [`0x1d4132b76b6a33f156ea4f66efd32015ea04612cf754666c3b349d89d11e2011`](https://explorer-studio.genlayer.com/tx/0x1d4132b76b6a33f156ea4f66efd32015ea04612cf754666c3b349d89d11e2011) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 31.61s | **60.0%** (3/5) |
| `submit_resolution` | [`0xe9a3457e57ff0da66c9fe7a0e569c489c05e6b00cda0bea8f2b98be45376f4a3`](https://explorer-studio.genlayer.com/tx/0xe9a3457e57ff0da66c9fe7a0e569c489c05e6b00cda0bea8f2b98be45376f4a3) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.42s | **60.0%** (3/5) |
| `challenge_resolution` | [`0xb56ab310f04b61d9d9b10ad5d8b1d51252880eb250dec912300af265f7e6d3e4`](https://explorer-studio.genlayer.com/tx/0xb56ab310f04b61d9d9b10ad5d8b1d51252880eb250dec912300af265f7e6d3e4) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 5.37s | **100.0%** (5/5) |
| `finalize_resolution` | [`0x73acc08da9391f0597ef8f27c8911bce5772bf713e141f0a88a45146a3bd8ced`](https://explorer-studio.genlayer.com/tx/0x73acc08da9391f0597ef8f27c8911bce5772bf713e141f0a88a45146a3bd8ced) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.58s | **60.0%** (3/5) |
| `register_commitment` | [`0x0578ed358ec77d3b81dd6af578bf88da31db2c02a67a761089606e3591be929c`](https://explorer-studio.genlayer.com/tx/0x0578ed358ec77d3b81dd6af578bf88da31db2c02a67a761089606e3591be929c) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 15.64s | **60.0%** (3/5) |
| `submit_resolution` | [`0x7f4a5aac518edeea22e82282e0987f2db4542e6c09d566579d96d9b6fdc813da`](https://explorer-studio.genlayer.com/tx/0x7f4a5aac518edeea22e82282e0987f2db4542e6c09d566579d96d9b6fdc813da) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 75.06s | **60.0%** (3/5) |
| `finalize_resolution` | [`0x510bbbdcf8bfb226e1382a5b6da84d3ed23e82f5b7089c7c3a0bdc4816091351`](https://explorer-studio.genlayer.com/tx/0x510bbbdcf8bfb226e1382a5b6da84d3ed23e82f5b7089c7c3a0bdc4816091351) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.55s | **60.0%** (3/5) |
| `challenge_resolution` | [`0x8b3ee9a00c1139c50584ed5e0b3361f0d808ac90b57e30de9480a4392c2914e0`](https://explorer-studio.genlayer.com/tx/0x8b3ee9a00c1139c50584ed5e0b3361f0d808ac90b57e30de9480a4392c2914e0) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 5.11s | **60.0%** (3/5) |
| `challenge_resolution` | [`0x955ec5a742ad660d666bc228d4bae68db349e793ae09d4cd83f920048ad3ab2b`](https://explorer-studio.genlayer.com/tx/0x955ec5a742ad660d666bc228d4bae68db349e793ae09d4cd83f920048ad3ab2b) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.61s | **100.0%** (5/5) |
| `finalize_resolution` | [`0x24ff6413f75fe0cea58bf7ac90acb4d3f39af48855ef5c0f264e6654a3dcf643`](https://explorer-studio.genlayer.com/tx/0x24ff6413f75fe0cea58bf7ac90acb4d3f39af48855ef5c0f264e6654a3dcf643) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.76s | **80.0%** (4/5) |
| `register_commitment` | [`0x346a956c5fe359f299ec5a34cdff42e9e8507d2c597070e557cd9de2f278b70c`](https://explorer-studio.genlayer.com/tx/0x346a956c5fe359f299ec5a34cdff42e9e8507d2c597070e557cd9de2f278b70c) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 42.68s | **60.0%** (3/5) |
| `submit_resolution` | [`0x575654d453a323b23676c9e1b0d7dde251e752e132dcea7d285aaaf904a2e778`](https://explorer-studio.genlayer.com/tx/0x575654d453a323b23676c9e1b0d7dde251e752e132dcea7d285aaaf904a2e778) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 38.22s | **60.0%** (3/5) |
| `finalize_resolution` | [`0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd`](https://explorer-studio.genlayer.com/tx/0xa74ba93acb13951a376e9ff7359b27b9f879800db7cceecdba63865836d83fcd) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.41s | **60.0%** (3/5) |
| `challenge_resolution` | [`0x137dda2a6d1770410dfd93dd7ef0e6e3d850bd19ed12a6b82bf831a4dc6baff8`](https://explorer-studio.genlayer.com/tx/0x137dda2a6d1770410dfd93dd7ef0e6e3d850bd19ed12a6b82bf831a4dc6baff8) | `ACCEPTED` | `MAJORITY_AGREE` | `SUCCESS` | 18.49s | **60.0%** (3/5) |
| `challenge_resolution` | [`0xf300bfa0030992528147e7c4de81c61ad8a933bd4d5f8eb5afe3e423ea108712`](https://explorer-studio.genlayer.com/tx/0xf300bfa0030992528147e7c4de81c61ad8a933bd4d5f8eb5afe3e423ea108712) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 5.21s | **60.0%** (3/5) |
| `finalize_resolution` | [`0x3f1092895b00e03365123e70f5e24851ae93fd87dc2a65aa4ceeefa4054b061c`](https://explorer-studio.genlayer.com/tx/0x3f1092895b00e03365123e70f5e24851ae93fd87dc2a65aa4ceeefa4054b061c) | `ACCEPTED` | `MAJORITY_AGREE` | `ERROR` | 8.41s | **60.0%** (3/5) |

## 6. Features Covered Exclusively in Pure/Mock Unit Tests

The following contract safeguards are rigorously verified via `tests/test_layer1_pure.py` and `tests/test_layer2_mocked.py`, but are intentionally not triggered on-chain to conserve studionet funds and avoid validator spam:

1. **Elements Bounds Enforcement**: Validation rejecting models that output fewer than 2 elements or more than 6 elements (`len(elements) > 6`).
2. **Strict Regex Calendar Date Parser**: Full date format validation rejecting malformed expressions (e.g. leap year invalid dates, non-numeric months, trailing whitespace).
3. **Exhaustive Element-to-Outcome Matrix**: All 14 combinatoric branches between ACTION, CONDITION, and DEADLINE satisfaction.
4. **Strict JSON Parser Resiliency**: Parser rejection of corrupted LLM payloads, non-object JSON roots, markdown fence stripping edge cases, and control character injections.
5. **Challenge Decision Cap**: Rejection of a 4th challenge when `MAX_DECISIONS = 3` is already reached.
6. **Deterministic Sentence Segmentation**: Segmentation boundary handling for decimal points, honorific abbreviations (Dr., Gen.), and sentence length capping at 240 characters.

