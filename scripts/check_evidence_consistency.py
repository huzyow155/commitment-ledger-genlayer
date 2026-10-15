import os
import json
import re
import sys
import glob

def check_consistency():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    deployments_path = os.path.join(root, "scripts", "deploy", "deployments.json")
    live_evidence_path = os.path.join(root, "scripts", "deploy", "live_evidence.json")
    gap_attempts_path = os.path.join(root, "scripts", "deploy", "gap_attempts.json")
    readme_path = os.path.join(root, "README.md")
    docs_dir = os.path.join(root, "docs")

    with open(deployments_path, "r", encoding="utf-8") as f:
        deployments = json.load(f)

    with open(live_evidence_path, "r", encoding="utf-8") as f:
        live_evidence = json.load(f)

    gap_attempts = {}
    if os.path.exists(gap_attempts_path):
        with open(gap_attempts_path, "r", encoding="utf-8") as f:
            gap_attempts = json.load(f)

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

    # Collect active commitment IDs and tx hashes across live_evidence and gap_attempts
    active_cids = set()
    active_hashes = set()

    def extract_active(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k in ("commitmentId", "cid") and isinstance(v, str):
                    active_cids.add(v.lower())
                elif isinstance(v, str) and v.startswith("0x") and len(v) == 66:
                    active_hashes.add(v.lower())
                extract_active(v)
        elif isinstance(obj, list):
            for item in obj:
                extract_active(item)

    extract_active(live_evidence)
    extract_active(gap_attempts)

    # Also add deployTxHash
    if deployments.get("deployTxHash"):
        active_hashes.add(deployments["deployTxHash"].lower())

    # Known superseded addresses and commitment IDs
    superseded_addrs = [item["address"].lower() for item in deployments.get("supersededDeployments", [])]
    superseded_cids = {
        "3d2cc5901dad", "d569fda4e876", "9875a6cdef6d",
        "ec77538d32e9", "a0d3d1ba6356", "7a681e3ba0a4"
    }

    # 1. Audit README.md
    with open(readme_path, "r", encoding="utf-8") as f:
        readme_content = f.read()

    readme_parts = readme_content.split("## Superseded Deployments")
    main_readme = readme_parts[0]

    # Verify no superseded address appears outside the superseded deployments table
    for s_addr in superseded_addrs:
        assert s_addr not in main_readme.lower(), (
            f"Superseded address {s_addr} found outside ## Superseded Deployments in README.md!"
        )

    # Verify no superseded commitment ID appears outside the superseded table
    for s_cid in superseded_cids:
        assert s_cid not in main_readme.lower(), (
            f"Superseded commitment ID {s_cid} found in main README.md!"
        )

    # Verify all transaction hashes in main README are active
    hash_pattern = re.compile(r"0x[0-9a-fA-F]{64}")
    for h in hash_pattern.findall(main_readme):
        assert h.lower() in active_hashes, (
            f"Unknown transaction hash {h} found in main README.md! Must be from active live_evidence."
        )

    # Verify commitment IDs in main README tables/code are active
    cid_pattern = re.compile(r"`([0-9a-f]{12})`")
    for match_cid in cid_pattern.findall(main_readme.lower()):
        assert match_cid in active_cids, (
            f"Unknown commitment ID {match_cid} found in main README.md! Must be from active live_evidence."
        )

    # 2. Audit docs/
    for fname in os.listdir(docs_dir):
        if not fname.endswith(".md"):
            continue
        fpath = os.path.join(docs_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            doc_content = f.read()

        # No superseded addresses in any doc
        for s_addr in superseded_addrs:
            assert s_addr not in doc_content.lower(), (
                f"Superseded address {s_addr} found in {fname}! It must only be in README.md."
            )

        # No superseded commitment IDs in any doc
        for s_cid in superseded_cids:
            assert s_cid not in doc_content.lower(), (
                f"Superseded commitment ID {s_cid} found in {fname}!"
            )

        # In EVIDENCE.md and INTEGRATION.md, verify all hashes and commitment IDs are active
        if fname in ("EVIDENCE.md", "INTEGRATION.md"):
            for h in hash_pattern.findall(doc_content):
                assert h.lower() in active_hashes, (
                    f"Unknown transaction hash {h} found in docs/{fname}! Must be from active live_evidence."
                )
            for match_cid in cid_pattern.findall(doc_content.lower()):
                assert match_cid in active_cids, (
                    f"Unknown commitment ID {match_cid} found in docs/{fname}! Must be from active live_evidence."
                )

    # 3. Verify no truncated hashes like '0x1234...5678' in README.md or docs
    files_to_check = [readme_path] + [os.path.join(docs_dir, f) for f in os.listdir(docs_dir) if f.endswith(".md")]
    truncated_pattern = re.compile(r"0x[a-fA-F0-9]{4,16}\.\.\.[a-fA-F0-9]{4,16}")
    for fpath in files_to_check:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            matches = truncated_pattern.findall(content)
            assert not matches, f"Truncated tx/address hash found in {os.path.basename(fpath)}: {matches}"

    print("PASSED: All evidence consistency assertions satisfied.")
    print(f"  Verified active contract address: {actual_contract}")
    print(f"  Verified {len(active_cids)} active commitment IDs and {len(active_hashes)} active hashes.")
    print(f"  Verified 0 superseded addresses outside README.md ## Superseded Deployments.")
    print(f"  Verified 0 superseded commitment IDs across README.md and docs/.")
    print(f"  Verified all transaction hashes and commitment IDs match active live_evidence.json.")

if __name__ == "__main__":
    check_consistency()
