import os
import json
import re
import sys

def check_consistency():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    deployments_path = os.path.join(root, "scripts", "deploy", "deployments.json")
    live_evidence_path = os.path.join(root, "scripts", "deploy", "live_evidence.json")
    readme_path = os.path.join(root, "README.md")
    docs_dir = os.path.join(root, "docs")

    with open(deployments_path, "r", encoding="utf-8") as f:
        deployments = json.load(f)

    with open(live_evidence_path, "r", encoding="utf-8") as f:
        live_evidence = json.load(f)

    expected_contract = deployments["contractAddress"]
    actual_contract = live_evidence["contractAddress"]

    assert actual_contract.lower() == expected_contract.lower(), (
        f"Contract address mismatch: {actual_contract} vs {expected_contract}"
    )

    # Check that deployTxHash is 66 chars
    for h in [deployments.get("deployTxHash"), live_evidence.get("deployTxHash")]:
        if h:
            assert h.startswith("0x") and len(h) == 66, f"Invalid deploy tx hash: '{h}'"

    cases = live_evidence.get("cases", {})
    for case_key, case_data in cases.items():
        title = case_data.get("title", "")
        record = case_data.get("finalRecord", {})
        outcome = record.get("outcome")

        # Check title vs outcome consistency
        if outcome == "KEPT":
            assert "KEPT" in title, f"{case_key} title '{title}' contradicts outcome KEPT"
        elif outcome == "BROKEN":
            assert "BROKEN" in title, f"{case_key} title '{title}' contradicts outcome BROKEN"
        elif outcome == "PARTIAL":
            assert "PARTIAL" in title, f"{case_key} title '{title}' contradicts outcome PARTIAL"
        elif outcome is None:
            assert "NOMATCH" in title or "OPEN" in title or "Distractor" in title or "Disagreed" in title or "Pending" in title, (
                f"{case_key} title '{title}' contradicts outcome null"
            )

        # Check transaction hash formats
        for tx_key in ["registerTx", "resolveTx"]:
            tx_hash = case_data.get(tx_key)
            if tx_hash:
                assert tx_hash.startswith("0x") and len(tx_hash) == 66, (
                    f"Invalid tx hash in {case_key}.{tx_key}: '{tx_hash}'"
                )

    # Check negative tests tx hashes
    neg_tests = live_evidence.get("negativeTests", {})
    for neg_key, neg_data in neg_tests.items():
        tx_hash = neg_data.get("txHash")
        if tx_hash:
            assert tx_hash.startswith("0x") and len(tx_hash) == 66, (
                f"Invalid tx hash in negativeTests.{neg_key}: '{tx_hash}'"
            )
        assert "revertPayload" in neg_data and neg_data["revertPayload"], (
            f"Missing revertPayload in negativeTests.{neg_key}"
        )

    # Check partialAttempts tx hashes
    for item in live_evidence.get("partialAttempts", []):
        for tx_key in ["registerTx", "resolveTx"]:
            tx_hash = item.get(tx_key)
            if tx_hash:
                assert tx_hash.startswith("0x") and len(tx_hash) == 66, (
                    f"Invalid tx hash in partialAttempts.{tx_key}: '{tx_hash}'"
                )

    # Check ungroundedAttempts tx hashes
    for item in live_evidence.get("ungroundedAttempts", []):
        for tx_key in ["registerTx", "resolveTx"]:
            tx_hash = item.get(tx_key)
            if tx_hash:
                assert tx_hash.startswith("0x") and len(tx_hash) == 66, (
                    f"Invalid tx hash in ungroundedAttempts.{tx_key}: '{tx_hash}'"
                )

    # Check superseded addresses: they must only appear in README.md under Superseded Deployments
    # and in scripts/deploy/deployments.json supersededDeployments
    superseded_addrs = [item["address"].lower() for item in deployments.get("supersededDeployments", [])]

    # Verify docs do NOT contain superseded addresses
    for fname in os.listdir(docs_dir):
        if fname.endswith(".md"):
            fpath = os.path.join(docs_dir, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read().lower()
                for s_addr in superseded_addrs:
                    assert s_addr not in content, (
                        f"Superseded address {s_addr} found in {fname}! It must only be in README.md."
                    )

    # Verify no truncated hashes like '0x1234...5678' in README.md or docs
    files_to_check = [readme_path] + [os.path.join(docs_dir, f) for f in os.listdir(docs_dir) if f.endswith(".md")]
    truncated_pattern = re.compile(r"0x[a-fA-F0-9]{4,16}\.\.\.[a-fA-F0-9]{4,16}")
    for fpath in files_to_check:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            matches = truncated_pattern.findall(content)
            assert not matches, f"Truncated tx/address hash found in {os.path.basename(fpath)}: {matches}"

    print("PASSED: All evidence consistency assertions satisfied.")
    print(f"  Verified contract address: {actual_contract}")
    print(f"  Verified {len(cases)} primary test cases without title-outcome contradiction.")
    print(f"  Verified {len(neg_tests)} negative tests with valid 66-char tx hashes and revert payloads.")
    print(f"  Verified no truncated hashes ('...') across markdown documentation.")
    print(f"  Verified superseded addresses do not leak into docs/ (only present in README & deployments.json).")

if __name__ == "__main__":
    check_consistency()
