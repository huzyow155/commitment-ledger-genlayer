const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient, chains, createAccount } = require('genlayer-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  let account;
  if (privateKey) {
    account = createAccount(privateKey);
    console.log("Using provided PRIVATE_KEY from environment.");
  } else {
    account = createAccount();
    console.log("No PRIVATE_KEY provided in environment. Using throwaway account.");
  }

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
  console.log("DEPLOYING COMMITMENTLEDGER v3.1.0 CONTRACT");
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
  console.log(`Deploy completed in ${elapsed}s`);
  console.log("Deploy Receipt status_name:", receipt.status_name);
  console.log("Deploy Receipt result_name:", receipt.result_name);
  const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
  console.log("Deploy Leader execution_result:", leaderReceipt?.execution_result);
  const contractAddress = receipt.recipient;
  console.log("New Contract Address:", contractAddress);

  if (!contractAddress) {
    throw new Error("No contract address returned from deployment receipt");
  }

  const deployments = {
    network: "GenLayer Studionet",
    chainId: 61999,
    rpc: "https://studio.genlayer.com/api",
    explorerBase: "https://explorer-studio.genlayer.com",
    contractAddress: contractAddress,
    deployTxHash: deployTxHash,
    deployStatus: receipt.status_name,
    consensusResult: receipt.result_name,
    executionResult: leaderReceipt?.execution_result || "SUCCESS",
    sourceFile: "contracts/CommitmentLedger.py",
    sourceSha256: localSha256,
    explorerUrl: `https://explorer-studio.genlayer.com/address/${contractAddress}`,
    supersededDeployments: [
      {
        address: "0xdD0d120B50ED65400E8b6a060bB15103B42544E8",
        deployTxHash: "0x9ddb3a96c40d222c8e4ac1b781029a3b6c33937796aa1348a060f4ea9ba14467",
        reason: "Superseded by v3.1.0: fixed outcome mapping truth table, dynamic current_decision_index, presented segments fingerprinting, robust HTML stripper, strict budget counting, UTC time derivation, strict JSON schema validation, and storage init ordering."
      },
      {
        address: "0x3155c7c80f4334968d61E1b79f74EB864CF7cb08",
        deployTxHash: "0x1aff7096cb2283f0e60ea74f4249d5d319f650177d9bee7a8ae798b7cf4c970a",
        reason: "Superseded by v3.0.0: answered steward review with temporal authenticity, element-based adjudication, and challenge state machine."
      },
      {
        address: "0x0A4Dc27c06520EA1EbcAEAFBF94f90b2AbDc6aa1",
        deployTxHash: "0x9b738652bceac390143a01f7dcf7ca24b7a92714430d950c34f9ae2936de4f52",
        reason: "Superseded by v2.2.0: could write PARTIAL when model returned no valid outcome."
      },
      {
        address: "0x8a5269aa724E77D799b3F0dbbaeee7683157f52d",
        deployTxHash: "0xc8461e53602c7cc610eab8d99bb8f277b388debb1366736529f90439ba8e4a6b",
        reason: "Superseded by v2.1.0: removed ungrounded fallback and enforced mandatory calendar date deadlines."
      },
      {
        address: "0x13b20E2DBc4E8C2D30e3E484D78ee90f583882F3",
        deployTxHash: "0x50015b28539130d6bebb768639427029725183f3b8b6b8b4490510c68ccfc235",
        reason: "Initial caller-written text prototype, superseded by source-based resolution."
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
