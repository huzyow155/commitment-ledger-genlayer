# Source Verification: CommitmentLedger

This document confirms that the deployed smart contract source code on GenLayer studionet matches the local source code in `contracts/CommitmentLedger.py` byte-for-byte.

## Verification Methodology

1. Query GenLayer JSON-RPC method `eth_getTransactionByHash` with the deploy transaction hash (`0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a`).
2. Extract the deployed contract code string from `result.data.contract_code`.
3. Base64-decode `contract_code` to recover the original Python source text.
4. Compute the SHA-256 hash of the decoded on-chain source text.
5. Compute the SHA-256 hash of the local file `contracts/CommitmentLedger.py`.
6. Assert exact equality between the hashes.

## Verification Results

| Parameter | Value |
| :--- | :--- |
| **Contract Name** | `CommitmentLedger` |
| **Contract Address** | `0x3155c7c80f4334968d61E1b79f74EB864CF7cb08` |
| **Deploy Transaction Hash** | `0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a` |
| **RPC Method Used** | `eth_getTransactionByHash` |
| **RPC Field Decoded** | `result.data.contract_code` (base64) |
| **Local Source SHA-256** | `fe63f0cc5a5788e2e3199919ddb5ee067c4c19c17389a8a250764f8e5299016f` |
| **On-Chain Decoded SHA-256** | `fe63f0cc5a5788e2e3199919ddb5ee067c4c19c17389a8a250764f8e5299016f` |
| **Source Character Count** | 15,285 bytes |
| **Verification Status** | **EXACT MATCH (VERIFIED)** |

For superseded deployments, see the [README](../README.md#superseded-deployments).

Verification report script: `scripts/verify_source.js`  
Verification output artifact: `scripts/deploy/verification_result.json`
