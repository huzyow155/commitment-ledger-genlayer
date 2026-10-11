# Source Verification: CommitmentLedger

This document confirms that the deployed smart contract source code on GenLayer studionet matches the local source code in `contracts/CommitmentLedger.py` byte-for-byte.

## Verification Methodology

1. Query GenLayer JSON-RPC method `eth_getTransactionByHash` with the deploy transaction hash (`0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b`).
2. Extract the deployed contract code string from `result.data.contract_code`.
3. Base64-decode `contract_code` to recover the original Python source text.
4. Compute the SHA-256 hash of the decoded on-chain source text.
5. Compute the SHA-256 hash of the local file `contracts/CommitmentLedger.py`.
6. Assert exact equality between the hashes.

## Verification Results

| Parameter | Value |
| :--- | :--- |
| **Contract Name** | `CommitmentLedger` |
| **Contract Address** | `0x8a5269aa724E77D799b3F0dbbaeee7683157f52d` |
| **Deploy Transaction Hash** | `0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b` |
| **RPC Method Used** | `eth_getTransactionByHash` |
| **RPC Field Decoded** | `result.data.contract_code` (base64) |
| **Local Source SHA-256** | `f490ea63b9fc604586ee6247f6c8f22ea7e92398ca14fca73ac2fdac13dcb8d0` |
| **On-Chain Decoded SHA-256** | `f490ea63b9fc604586ee6247f6c8f22ea7e92398ca14fca73ac2fdac13dcb8d0` |
| **Source Character Count** | 13,950 bytes |
| **Verification Status** | **EXACT MATCH (VERIFIED)** |

### Superseded Deployments

| Address | Deploy Transaction Hash | Superseded Note |
| :--- | :--- | :--- |
| `0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3` | `0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235` | Initial text-based resolution prototype, superseded by source-URL allowlisted resolution (Option A). |

Verification report script: `scripts/verify_source.js`  
Verification output artifact: `scripts/deploy/verification_result.json`
