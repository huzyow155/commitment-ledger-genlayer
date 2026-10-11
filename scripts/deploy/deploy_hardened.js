const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const account = createAccount();
  console.log("Deployer address:", account.address);
  const client = createClient({
    chain: chains.studionet,
    account: account,
  });

  const codePath = path.join(__dirname, '../../contracts/CommitmentLedger.py');
  const code = fs.readFileSync(codePath, 'utf8');
  const localSha256 = crypto.createHash('sha256').update(code, 'utf8').digest('hex');
  console.log("Local contract source sha256:", localSha256);

  console.log("\n=======================================================");
  console.log("DEPLOYING NEW HARDENED COMMITMENTLEDGER CONTRACT");
  console.log("=======================================================");
  const t0 = Date.now();
  const deployTxHash = await client.deployContract({
    code: code,
    args: [],
  });
  console.log("Deploy Tx Hash:", deployTxHash);

  const receipt = await client.waitForTransactionReceipt({
    hash: deployTxHash,
    retries: 120,
    interval: 3000,
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`Deploy finished in ${elapsed}s`);
  console.log("Deploy Receipt status_name:", receipt.status_name);
  console.log("Deploy Receipt result_name:", receipt.result_name);
  const contractAddress = receipt.recipient;
  console.log("New Contract Address:", contractAddress);

  if (!contractAddress) {
    throw new Error("No contract address returned from deployment receipt");
  }

  // Update deployments.json
  const deployments = {
    network: "GenLayer Studionet",
    chainId: 61999,
    rpc: "https://studio.genlayer.com/api",
    explorerBase: "https://explorer-studio.genlayer.com",
    contractAddress: contractAddress,
    deployTxHash: deployTxHash,
    deployStatus: receipt.status_name,
    consensusResult: receipt.result_name,
    executionResult: receipt.consensus_data?.leader_receipt?.[0]?.execution_result || "SUCCESS",
    sourceFile: "contracts/CommitmentLedger.py",
    sourceSha256: localSha256,
    explorerUrl: `https://explorer-studio.genlayer.com/address/${contractAddress}`,
    supersededDeployments: [
      {
        address: "0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3",
        deployTxHash: "0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235",
        reason: "Superseded by source-based resolution hardening (Option A)"
      }
    ]
  };

  fs.writeFileSync(
    path.join(__dirname, 'deployments.json'),
    JSON.stringify(deployments, null, 2)
  );
  console.log("Updated scripts/deploy/deployments.json");
}

main().catch(err => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
