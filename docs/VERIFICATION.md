# Source Verification: CommitmentLedger

This document confirms that the deployed smart contract source code on GenLayer Studionet (Preview) matches the local source code in `contracts/CommitmentLedger.py` byte-for-byte.

## Verification Methodology

1. Query GenLayer JSON-RPC method `eth_getTransactionByHash` with the deploy transaction hash (`0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467`).
2. Extract the deployed contract code string from `result.data.contract_code`.
3. Base64-decode `contract_code` to recover the original Python source text.
4. Compute the SHA-256 hash of the decoded on-chain source text.
5. Compute the SHA-256 hash of the local file `contracts/CommitmentLedger.py`.
6. Assert exact equality between the hashes.

## Verification Results

| Parameter | Value |
| :--- | :--- |
| **Contract Name** | `CommitmentLedger` |
| **Contract Address** | `0xdD0d120B50ED65400E8b6a060bB15103B42544E8` |
| **Deploy Transaction Hash** | `0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467` |
| **RPC Method Used** | `eth_getTransactionByHash` |
| **RPC Field Decoded** | `result.data.contract_code` (base64) |
| **Local Source SHA-256** | `e14342dac8a0bdb983d4796557a59d3ae0e47e0715b9290d46cf3986cae1ac9c` |
| **On-Chain Decoded SHA-256** | `e14342dac8a0bdb983d4796557a59d3ae0e47e0715b9290d46cf3986cae1ac9c` |
| **Source Character Count** | 37,236 bytes |
| **Verification Status** | **EXACT MATCH (VERIFIED)** |

For superseded deployments, see the [README](../README.md#superseded-deployments).

Verification report script: `scripts/verify_source.js`  
Verification output artifact: `scripts/deploy/verification_result.json`
