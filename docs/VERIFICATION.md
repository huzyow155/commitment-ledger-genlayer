# Source Verification: CommitmentLedger

This document confirms that the deployed smart contract source code on GenLayer studionet matches the local source code in `contracts/CommitmentLedger.py` byte-for-byte.

## Verification Methodology

1. Query GenLayer JSON-RPC method `eth_getTransactionByHash` with the deploy transaction hash (`0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235`).
2. Extract the deployed contract code string from `result.data.contract_code`.
3. Base64-decode `contract_code` to recover the original Python source text.
4. Compute the SHA-256 hash of the decoded on-chain source text.
5. Compute the SHA-256 hash of the local file `contracts/CommitmentLedger.py`.
6. Assert exact equality between the hashes.

## Verification Results

| Parameter | Value |
| :--- | :--- |
| **Contract Name** | `CommitmentLedger` |
| **Contract Address** | `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` |
| **Deploy Transaction Hash** | `0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235` |
| **RPC Method Used** | `eth_getTransactionByHash` |
| **RPC Field Decoded** | `result.data.contract_code` (base64) |
| **Local Source SHA-256** | `8306c5cb7a8316ff6ef737e728a03263275042bce402b821b4941cd880d84aeb` |
| **On-Chain Decoded SHA-256** | `8306c5cb7a8316ff6ef737e728a03263275042bce402b821b4941cd880d84aeb` |
| **Source Character Count** | 9,495 bytes |
| **Verification Status** | **EXACT MATCH (VERIFIED)** |

Verification report script: `scripts/verify_source.js`  
Verification output artifact: `scripts/deploy/verification_result.json`
