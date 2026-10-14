# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


class Probe(gl.Contract):
    probe_results: str

    def __init__(self):
        self.probe_results = "{}"

    @gl.public.view
    def get_results(self) -> str:
        return self.probe_results

    @gl.public.write
    def test_apollo_eval(self) -> None:
        def run_eval() -> str:
            # Try web.get first for speed
            text = ""
            try:
                resp = gl.nondet.web.get("https://en.wikipedia.org/wiki/Apollo_11")
                if int(resp.status) == 200:
                    b = resp.body
                    text = b.decode("utf-8", errors="replace") if isinstance(b, (bytes, bytearray)) else str(b)
            except Exception:
                text = ""

            if not text:
                text = str(gl.nondet.web.render("https://en.wikipedia.org/wiki/Apollo_11", mode="text"))

            prompt = (
                "You are an impartial adjudicator evaluating whether Apollo 11 fulfilled its commitment.\n"
                "Commitment: Apollo 11 will land human astronauts on the Moon before 1970.\n\n"
                "Document excerpt:\n%s\n\n"
                "Return JSON: {\"outcome\": \"KEPT\" or \"BROKEN\"}"
            ) % text[:3000]

            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(raw)

        res = gl.eq_principle.prompt_comparative(
            run_eval,
            "Both answers agree on the same outcome (KEPT or BROKEN) for the Apollo 11 mission commitment."
        )
        self.probe_results = res
