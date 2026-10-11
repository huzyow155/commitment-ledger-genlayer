# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


class Probe(gl.Contract):
    probe_results: str

    def __init__(self):
        info = {}
        # Test sender address accessor
        sender = gl.message.sender_address
        info["sender_hex"] = sender.as_hex
        info["sender_str"] = str(sender)

        # Test hashlib import and hashing
        import hashlib
        info["hash_test"] = hashlib.sha256(b"probe_init").hexdigest()[:12]

        # Test user error class availability
        info["has_user_error"] = hasattr(gl.vm, "UserError")

        self.probe_results = json.dumps(info)

    @gl.public.view
    def get_results(self) -> str:
        return self.probe_results

    @gl.public.write
    def probe_consensus(self) -> None:
        def run_nondet() -> str:
            import hashlib
            h = hashlib.sha256(b"nondet_test").hexdigest()[:12]

            # Test exec_prompt with json format
            prompt = (
                "You are an evaluator. Return only JSON: {\"status\": \"OK\", \"code\": 100}"
            )
            raw = gl.nondet.exec_prompt(prompt, response_format="json")

            res_type = type(raw).__name__
            val = ""
            if isinstance(raw, dict):
                val = str(raw.get("status", ""))
            elif isinstance(raw, str):
                try:
                    import json as jmod
                    parsed = jmod.loads(raw)
                    val = str(parsed.get("status", ""))
                except Exception:
                    val = "PARSE_ERR"
            else:
                val = str(raw)

            return f"HASH:{h}|TYPE:{res_type}|VAL:{val}"

        result_str = gl.eq_principle.strict_eq(run_nondet)

        current = json.loads(self.probe_results)
        current["consensus_result"] = result_str
        self.probe_results = json.dumps(current)
