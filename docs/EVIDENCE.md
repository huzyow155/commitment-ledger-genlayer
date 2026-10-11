# On-Chain Evidence: CommitmentLedger v2.2.0

This document records the exact, verified on-chain evidence transactions executed on GenLayer Studionet (Preview) for contract `0x3155c7c80f4334968d61E1b79f74EB864CF7cb08`.

- **Active Contract Address**: [`0x3155c7c80f4334968d61E1b79f74EB864CF7cb08`](https://explorer-studio.genlayer.com/address/0x3155c7c80f4334968d61E1b79f74EB864CF7cb08)
- **Deploy Transaction Hash**: [`0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a`](https://explorer-studio.genlayer.com/tx/0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a)

## 1. Verified Case Resolutions

### Case A (Paraphrased Source, KEPT)

- **Commitment ID**: `1fe69a47c557`
- **Raw Text**: "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970."
- **Deadline**: `1970-01-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_11
- **Register Transaction Hash**: [`0xd61b234967a1011ec915b56afeae573fb4bd54192f5ad1358fd82a90d1737abd`](https://explorer-studio.genlayer.com/tx/0xd61b234967a1011ec915b56afeae573fb4bd54192f5ad1358fd82a90d1737abd)
- **Resolve Transaction Hash**: [`0x54b64f75cd22ef47ac2adecc71ee1e37dd95869c75ea7a274a7c6424e8b715c5`](https://explorer-studio.genlayer.com/tx/0x54b64f75cd22ef47ac2adecc71ee1e37dd95869c75ea7a274a7c6424e8b715c5)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `KEPT`
- **Grounded Resolution Quote**: "Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon"
- **Read-Back Method & Field**: `client.readContract({ functionName: 'get_commitment', args: ['1fe69a47c557'] })` returning field `outcome`

```json
{
  "schema_version": "2.2.0",
  "commitment_id": "1fe69a47c557",
  "registrant": "0x71B47328E05e68875cBc203a1B4d04fA2A0965B6",
  "raw_text": "The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970.",
  "subject": "apollo 11 mission",
  "action": "land human astronauts on the lunar surface before 1970",
  "deadline_hint": "1970-01-01",
  "created_round": 1,
  "status": "RESOLVED",
  "outcome": "KEPT",
  "source_url": "https://en.wikipedia.org/wiki/Apollo_11",
  "resolution_quote": "Apollo 11 (July 16–24, 1969) was the American spaceflight that first landed humans on the Moon",
  "match_confirmed": true,
  "resolved_at": "2026-10-11T17:51:14.230481Z",
  "resolver": "0x71B47328E05e68875cBc203a1B4d04fA2A0965B6"
}
```

### Case B (Grounded Quote, BROKEN)

- **Commitment ID**: `605aa94797d3`
- **Raw Text**: "Apollo 13 will successfully land on the Moon."
- **Deadline**: `1970-05-01`
- **Source URL**: https://en.wikipedia.org/wiki/Apollo_13
- **Register Transaction Hash**: [`0xae2cd4b15272a53eaf11d6d3fb9fc5200610ddf170c494672f81c42cd7333823`](https://explorer-studio.genlayer.com/tx/0xae2cd4b15272a53eaf11d6d3fb9fc5200610ddf170c494672f81c42cd7333823)
- **Resolve Transaction Hash**: [`0xf04a899cfb85a62e958a7e378b063026f21811726c8f8a612c7fbf080a85e943`](https://explorer-studio.genlayer.com/tx/0xf04a899cfb85a62e958a7e378b063026f21811726c8f8a612c7fbf080a85e943)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `SUCCESS`
- **Recorded Outcome**: `BROKEN`
- **Grounded Resolution Quote**: "the landing was aborted after an oxygen tank in the service module (SM) exploded two days into the mission"
- **Read-Back Method & Field**: `client.readContract({ functionName: 'get_commitment', args: ['605aa94797d3'] })` returning field `outcome`

```json
{
  "schema_version": "2.2.0",
  "commitment_id": "605aa94797d3",
  "registrant": "0x71B47328E05e68875cBc203a1B4d04fA2A0965B6",
  "raw_text": "Apollo 13 will successfully land on the Moon.",
  "subject": "apollo 13",
  "action": "successfully land on the moon",
  "deadline_hint": "1970-05-01",
  "created_round": 2,
  "status": "RESOLVED",
  "outcome": "BROKEN",
  "source_url": "https://en.wikipedia.org/wiki/Apollo_13",
  "resolution_quote": "the landing was aborted after an oxygen tank in the service module (SM) exploded two days into the mission",
  "match_confirmed": true,
  "resolved_at": "2026-10-11T17:52:20.286842Z",
  "resolver": "0x71B47328E05e68875cBc203a1B4d04fA2A0965B6"
}
```

### Case C (Distractor Rejection, NOMATCH)

- **Commitment ID**: `4efe7cbd0772`
- **Raw Text**: "NASA will verify the James Webb Space Telescope deployment."
- **Deadline**: `2022-01-01`
- **Source URL**: https://en.wikipedia.org/wiki/Falcon_9
- **Register Transaction Hash**: [`0x588c25fb25bbb86c235943ae06a9dcfd7523238e1d177be731bad1244c7baec2`](https://explorer-studio.genlayer.com/tx/0x588c25fb25bbb86c235943ae06a9dcfd7523238e1d177be731bad1244c7baec2)
- **Resolve Transaction Hash**: [`0x7dda2fcd83a02ce8d34fc451d3ff5bff18129ea078cc4a1d31776e1f73b74a59`](https://explorer-studio.genlayer.com/tx/0x7dda2fcd83a02ce8d34fc451d3ff5bff18129ea078cc4a1d31776e1f73b74a59)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Recorded Outcome**: `null`
- **Grounded Resolution Quote**: None
- **Read-Back Method & Field**: `client.readContract({ functionName: 'get_commitment', args: ['4efe7cbd0772'] })` returning field `outcome`

```json
{
  "schema_version": "2.2.0",
  "commitment_id": "4efe7cbd0772",
  "registrant": "0x71B47328E05e68875cBc203a1B4d04fA2A0965B6",
  "raw_text": "NASA will verify the James Webb Space Telescope deployment.",
  "subject": "nasa",
  "action": "verify james webb space telescope deployment",
  "deadline_hint": "2022-01-01",
  "created_round": 3,
  "status": "OPEN",
  "outcome": null,
  "source_url": null,
  "resolution_quote": null,
  "match_confirmed": false,
  "resolved_at": null,
  "resolver": null
}
```

## 2. On-Chain Negative Rejection Tests

Every negative test below was verified on GenLayer Studionet by querying JSON-RPC `eth_getTransactionByHash` and decoding base64 field `result.consensus_data.leader_receipt[0].result` (first byte sliced off, remainder decoded as UTF-8 string):

### nonAllowlistedDomain

- **Submitted Parameter (URL)**: `https://github.com/nasa/webb`
- **Transaction Hash**: [`0x5700f1c0b10574950bf94bd8b6fa5b8a19774fdc6d5e1b35c9c5f51712362516`](https://explorer-studio.genlayer.com/tx/0x5700f1c0b10574950bf94bd8b6fa5b8a19774fdc6d5e1b35c9c5f51712362516)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"source_url domain not in authorized allowlist"`
- **Decode Method**: JSON-RPC `eth_getTransactionByHash`, sliced base64 payload from `consensus_data.leader_receipt[0].result`

### insecureScheme

- **Submitted Parameter (URL)**: `http://en.wikipedia.org/wiki/Falcon_9`
- **Transaction Hash**: [`0x39b53afc63f6280205fc802b6edc9716878fa1ed73e1677aace2cbf89caef1ef`](https://explorer-studio.genlayer.com/tx/0x39b53afc63f6280205fc802b6edc9716878fa1ed73e1677aace2cbf89caef1ef)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"source_url scheme must be https"`
- **Decode Method**: JSON-RPC `eth_getTransactionByHash`, sliced base64 payload from `consensus_data.leader_receipt[0].result`

### freeTextDeadline

- **Submitted Parameter (Deadline)**: `end of Q2`
- **Transaction Hash**: [`0x334a98052827dae100223ef13febac25f35b7ed06a766435e1bbb8f9730ede43`](https://explorer-studio.genlayer.com/tx/0x334a98052827dae100223ef13febac25f35b7ed06a766435e1bbb8f9730ede43)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"deadline_hint must be YYYY-MM-DD"`
- **Decode Method**: JSON-RPC `eth_getTransactionByHash`, sliced base64 payload from `consensus_data.leader_receipt[0].result`

### prematureResolution

- **Target Commitment ID**: `a46761c192e4`
- **Transaction Hash**: [`0xbf92e012a6ba8d58288b1138d4b66be0f6a25cef8364ce7d19d2639bfee8c11a`](https://explorer-studio.genlayer.com/tx/0xbf92e012a6ba8d58288b1138d4b66be0f6a25cef8364ce7d19d2639bfee8c11a)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"cannot resolve before deadline date"`
- **Decode Method**: JSON-RPC `eth_getTransactionByHash`, sliced base64 payload from `consensus_data.leader_receipt[0].result`

### alreadyResolved

- **Target Commitment ID**: `1fe69a47c557`
- **Transaction Hash**: [`0x909b41a144f8469f9983e103aee508601a6b499e1ef6db5ac1ea759906e2c5d2`](https://explorer-studio.genlayer.com/tx/0x909b41a144f8469f9983e103aee508601a6b499e1ef6db5ac1ea759906e2c5d2)
- **Receipt Status Name**: `ACCEPTED`
- **Leader Execution Result**: `ERROR`
- **Decoded Revert Payload**: `"commitment already resolved"`
- **Decode Method**: JSON-RPC `eth_getTransactionByHash`, sliced base64 payload from `consensus_data.leader_receipt[0].result`

## 3. UNGROUNDED / INVALID Branch Attempts

- **Attempt 1** (`74bbbc860343`): "The Apollo 11 crew will complete biological decontamination procedures aboard the USS Hornet in the Pacific Ocean." -> https://en.wikipedia.org/wiki/Apollo_11
  - Register: [`0x44b2736698ef901fdcc05396d00b2ce2bf48bf12dda389e02abaa343390fc4f1`](https://explorer-studio.genlayer.com/tx/0x44b2736698ef901fdcc05396d00b2ce2bf48bf12dda389e02abaa343390fc4f1)
  - Resolve: [`0x18d9a60790aedba1cece4ef2bdf2392d224683ae8de80889b8bb0428ec3a24d3`](https://explorer-studio.genlayer.com/tx/0x18d9a60790aedba1cece4ef2bdf2392d224683ae8de80889b8bb0428ec3a24d3)
  - Result: OPEN (source does not match this commitment)
  - Note: Decontamination detail absent in first 6,000 characters; validators evaluated as NOMATCH distractor rather than matching with hallucinated quote.

