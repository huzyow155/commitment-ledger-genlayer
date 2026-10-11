# Runtime Notes (Milestone 0 Probe)

This document records the empirical behavior of the GenLayer studionet runtime as probed by the `Probe` contract deployment and write transaction.

## 1. Verified Header

The contract header must be verbatim:

```python
# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
```

All source files must contain strictly pure ASCII characters to prevent schema generation failures in Studio.

## 2. Probe Execution Findings

- **Probe Contract Address**: `0x0Cf60411bEc630834c5DC167DE3aB08dbB7F4c9E`
- **Deploy Tx Hash**: `0x4c8b8a63de6c8d31013db23f2136ad99ffd1886b4d27c39d87346ffff6b848bb`
- **Deploy Status**: `status_name: ACCEPTED`, `result_name: MAJORITY_AGREE`
- **Consensus Tx Hash**: `0x57dcc1632c593e21904a50d238c6102f1b17252822ca022fa8bb16ab605b35e5`
- **Consensus Status**: `status_name: ACCEPTED`, `result_name: MAJORITY_AGREE`, `leader_receipt[0].execution_result: SUCCESS`
- **Measured Consensus Latency**: 15.35 seconds

### Sender Address Accessor
- Accessor: `gl.message.sender_address`
- String representation: both `gl.message.sender_address.as_hex` and `str(gl.message.sender_address)` yield the checksummed hex address string: `0xE48D8DcAe366A5C16536c5A48aF99cBEF695f5b0`.
- In contract storage and views, storing `gl.message.sender_address.as_hex` provides consistent casing.

### Cryptographic and Standard Libraries
- `import hashlib` succeeds inside contract methods.
- `hashlib.sha256(b"...").hexdigest()[:12]` executes without error (Init test returned `27ad0b4a9957`, Nondet test returned `25e764a9d889`).

### Error Handling Class
- `gl.vm.UserError` is verified: `hasattr(gl.vm, "UserError") == True`.
- Used for contract validation and rejecting mismatches or invalid states.

### Equivalence Principle & Consensus
- `gl.eq_principle.strict_eq(fn)` executes the provided nondeterministic closure across independent validators and verifies string equality.
- Quorum is achieved when a majority of validators agree on the return string (`result_name: MAJORITY_AGREE`).

### LLM Prompt Execution (`gl.nondet.exec_prompt`)
- Calling `gl.nondet.exec_prompt(prompt, response_format="json")` returns a Python `dict` object on this runtime version (`TYPE:dict|VAL:OK`).
- **Defensive parsing rule**: To guarantee resilience against model nuances, contracts must defensively handle:
  1. Direct `dict` return (`obj.get(...)`)
  2. String return with JSON content (`json.loads(text)`)
  3. String wrapped in Markdown code fences (`re.sub(r"^```(?:json)?", "", text)`)
  4. Regex extraction fallback for key patterns (`re.search(...)`).
- Decisions must always be reduced to a tiny canonical string (e.g., `"MATCH|KEPT|<quote>"`, `"NOMATCH|NONE|NONE"`) before being returned to `gl.eq_principle.strict_eq`.
