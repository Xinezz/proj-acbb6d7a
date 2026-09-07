import os, re, sys, json

BASE = os.path.dirname(os.path.abspath(__file__)) + os.sep

with open(BASE + "braverse-binder.html", "r", encoding="utf-8") as f:
    original = f.read()

# Locate the applogic script content (the running script's own source, SELF_SRC)
m = re.search(r'<script id="applogic">(.*)</script>\n</body>\n</html>\n$', original, re.DOTALL)
if not m:
    print("FAIL: could not locate applogic script block")
    sys.exit(1)
self_src = m.group(1)

# The applogic script defines PART_A/PART_B1/PART_B2 as JS string literals near the top.
# Extract them by finding the var declarations and JSON-decoding the JS string literal
# (they were produced via json.dumps in build.py, so they're valid JSON string literals
# modulo the </script> and <!-- escaping build.py adds; undo that escaping first).
def extract_js_str_literal(varname, src):
    pat = re.compile(r'var ' + varname + r' = ("(?:[^"\\]|\\.)*");', re.DOTALL)
    mm = pat.search(src)
    if not mm:
        raise ValueError("literal not found: " + varname)
    lit = mm.group(1)
    # undo build.py's defensive escaping so json.loads sees the original JSON string
    lit = lit.replace("<\\/script", "</script").replace("<\\/SCRIPT", "</SCRIPT")
    lit = lit.replace("<\\!--", "<!--")
    return json.loads(lit)

PART_A = extract_js_str_literal("PART_A", self_src)
PART_B1 = extract_js_str_literal("PART_B1", self_src)
PART_B2 = extract_js_str_literal("PART_B2", self_src)

# Locate the cr-state JSON blob as actually embedded in the document
state_m = re.search(r'<script id="cr-state" type="application/json">(.*?)</script>\n', original, re.DOTALL)
if not state_m:
    print("FAIL: could not locate cr-state block")
    sys.exit(1)
state_json = state_m.group(1)

# Reassemble via the same formula buildDocument() uses: PART_A + stateJson + PART_B1 + SELF_SRC + PART_B2
rebuilt = PART_A + state_json + PART_B1 + self_src + PART_B2

if rebuilt == original:
    print("PASS: byte-exact round trip (generation 1), length", len(rebuilt))
else:
    print("FAIL: generation-1 mismatch")
    print("original len:", len(original), "rebuilt len:", len(rebuilt))
    # find first diff
    n = min(len(original), len(rebuilt))
    for i in range(n):
        if original[i] != rebuilt[i]:
            print("first diff at byte", i)
            print("original around:", repr(original[max(0,i-60):i+60]))
            print("rebuilt  around:", repr(rebuilt[max(0,i-60):i+60]))
            break
    sys.exit(1)

# Simulate a second generation: re-extract PART_A/B1/B2/SELF_SRC from the rebuilt doc
# (i.e. as if the app republished itself with a different state) and confirm the
# static template fragments and the script source are unchanged byte-for-byte.
new_state_json = json.dumps({"owned": ["TEST-001", "TEST-002"], "spending": [{"id":"s_test1","date":"2026-09-01","amount":12.5,"note":"Test pack"}]})
gen2 = PART_A + new_state_json + PART_B1 + self_src + PART_B2

m2 = re.search(r'<script id="applogic">(.*)</script>\n</body>\n</html>\n$', gen2, re.DOTALL)
if not m2:
    print("FAIL: gen2 could not locate applogic script block")
    sys.exit(1)
self_src_2 = m2.group(1)

PART_A_2 = extract_js_str_literal("PART_A", self_src_2)
PART_B1_2 = extract_js_str_literal("PART_B1", self_src_2)
PART_B2_2 = extract_js_str_literal("PART_B2", self_src_2)

ok = True
if PART_A_2 != PART_A:
    print("FAIL: PART_A drifted across generation 2"); ok = False
if PART_B1_2 != PART_B1:
    print("FAIL: PART_B1 drifted across generation 2"); ok = False
if PART_B2_2 != PART_B2:
    print("FAIL: PART_B2 drifted across generation 2"); ok = False
if self_src_2 != self_src:
    print("FAIL: applogic script source drifted across generation 2"); ok = False

state_m2 = re.search(r'<script id="cr-state" type="application/json">(.*?)</script>\n', gen2, re.DOTALL)
if not state_m2 or state_m2.group(1) != new_state_json:
    print("FAIL: gen2 state json not embedded as expected"); ok = False

if ok:
    print("PASS: generation-2 simulated republish stays byte-identical (template + script), length", len(gen2))
else:
    sys.exit(1)

# Sanity: unresolved placeholders must not remain anywhere in the executable script
for placeholder in ("__PART_A__", "__PART_B1__", "__PART_B2__", "__CARDS_JSON__", "__SET_META_JSON__"):
    if placeholder in self_src:
        print("FAIL: unresolved placeholder remains:", placeholder)
        sys.exit(1)
print("PASS: no unresolved placeholders in applogic script")

print("ALL CHECKS PASSED")
