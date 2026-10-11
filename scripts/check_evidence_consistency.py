import os
import json
import sys

def check_consistency():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    deployments_path = os.path.join(root, "scripts", "deploy", "deployments.json")
    live_evidence_path = os.path.join(root, "scripts", "deploy", "live_evidence.json")

    with open(deployments_path, "r", encoding="utf-8") as f:
        deployments = json.load(f)

    with open(live_evidence_path, "r", encoding="utf-8") as f:
        live_evidence = json.load(f)

    expected_contract = deployments["contractAddress"]
    actual_contract = live_evidence["contractAddress"]

    assert actual_contract.lower() == expected_contract.lower(), (
        f"Contract address mismatch: {actual_contract} vs {expected_contract}"
    )

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
            assert "NOMATCH" in title or "OPEN" in title or "Distractor" in title, (
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

    print("PASSED: All evidence consistency assertions satisfied.")
    print(f"  Verified contract address: {actual_contract}")
    print(f"  Verified {len(cases)} primary test cases without title-outcome contradiction.")
    print(f"  Verified {len(neg_tests)} negative tests with valid tx hashes and revert payloads.")

if __name__ == "__main__":
    check_consistency()
