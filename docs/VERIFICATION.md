# Source Verification: CommitmentLedger

This document confirms that the deployed smart contract source code on GenLayer Studionet (Preview) matches the local source code in `contracts/CommitmentLedger.py` byte-for-byte.

## Verification Methodology

1. Query GenLayer JSON-RPC method `eth_getTransactionByHash` with the deploy transaction hash (`0x6654b4245ee74f4f1339ef13cdff1cf9654cb83714ed9e9810b81ba313f868d6`).
2. Extract the deployed contract code string from `result.data.contract_code`.
3. Base64-decode `contract_code` to recover the original Python source text.
4. Compute the SHA-256 hash of the decoded on-chain source text.
5. Compute the SHA-256 hash of the local file `contracts/CommitmentLedger.py`.
6. Assert exact equality between the hashes.

## Verification Results

| Parameter | Value |
| :--- | :--- |
| **Contract Name** | `CommitmentLedger` |
| **Contract Address** | `0xBaC90bbD20C3F9Ad873B602eC3684EF3145597DB` |
| **Deploy Transaction Hash** | `0x6654b4245ee74f4f1339ef13cdff1cf9654cb83714ed9e9810b81ba313f868d6` |
| **RPC Method Used** | `eth_getTransactionByHash` |
| **RPC Field Decoded** | `result.data.contract_code` (base64) |
| **Local Source SHA-256** | `9380175f322387696259a522483239be209d58b8e21fd4928cadf4ab46702e0e` |
| **On-Chain Decoded SHA-256** | `9380175f322387696259a522483239be209d58b8e21fd4928cadf4ab46702e0e` |
| **Source Character Count** | 45,034 bytes |
| **Verification Status** | **EXACT MATCH (VERIFIED)** |

For superseded deployments, see the [README](../README.md#superseded-deployments).

Verification report script: `scripts/verify_source.js`  
Verification output artifact: `scripts/deploy/verification_result.json`
