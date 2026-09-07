import json, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__)) + os.sep

def read(path):
    with open(BASE + path, "r", encoding="utf-8") as f:
        return f.read()

def js_string_literal(s):
    """Produce a safe JS double-quoted string literal for embedding raw HTML/JS text
    inside a <script> element, guarding against premature </script> termination
    and JS line-terminator characters."""
    lit = json.dumps(s)  # handles quotes, backslashes, newlines, unicode
    # prevent the HTML parser from ending the enclosing <script> early
    lit = lit.replace("</script", "<\\/script").replace("</SCRIPT", "<\\/SCRIPT")
    lit = lit.replace("<!--", "<\\!--")
    # JSON.dumps in Python does not escape U+2028/U+2029; older JS engines treat
    # them as line terminators inside string literals -- escape defensively.
    lit = lit.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    return lit

css = read("style.css")
shell = read("shell.html")
cards = read("cards_with_img_v2.json").strip()
set_meta = read("set_meta.json").strip()
app_js_template = read("app.js")

FONT_LINK = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;0,6..12,800;1,6..12,600&family=JetBrains+Mono:wght@500;700&display=swap">'

HEAD = (
'<!doctype html>\n'
'<html lang="en">\n'
'<head>\n'
'<meta charset="UTF-8">\n'
'<meta name="viewport" content="width=device-width, initial-scale=1">\n'
'<title>Braverse Binder</title>\n'
+ FONT_LINK + '\n'
'<style>\n' + css + '\n</style>\n'
'</head>\n'
'<body>\n'
'<script id="cr-state" type="application/json">'
)

TAIL_AFTER_STATE_BEFORE_APPLOGIC = (
    '</script>\n'
    + shell
    + '\n<script id="applogic">'
)

TAIL_AFTER_APPLOGIC = (
    '</script>\n'
    '</body>\n'
    '</html>\n'
)

PART_A_LIT = js_string_literal(HEAD)
PART_B1_LIT = js_string_literal(TAIL_AFTER_STATE_BEFORE_APPLOGIC)
PART_B2_LIT = js_string_literal(TAIL_AFTER_APPLOGIC)

app_js = app_js_template
app_js = app_js.replace('"__PART_A__"', PART_A_LIT)
app_js = app_js.replace('"__PART_B1__"', PART_B1_LIT)
app_js = app_js.replace('"__PART_B2__"', PART_B2_LIT)
app_js = app_js.replace('__CARDS_JSON__', cards)
app_js = app_js.replace('__SET_META_JSON__', set_meta)

if '__PART_A__' in app_js or '__CARDS_JSON__' in app_js or '__SET_META_JSON__' in app_js:
    print("ERROR: unresolved placeholder remains", file=sys.stderr)
    sys.exit(1)

# also guard the *executable* app_js itself against a literal </script> sequence
# (there shouldn't be one, since we build closing tags via string concatenation,
# but double check defensively)
if re.search(r'</script', app_js, re.IGNORECASE):
    print("WARNING: literal </script found in app_js source -- inspect!", file=sys.stderr)

# Must mirror the live artifact's current cr-state (checked before this build) so a
# republish never wipes progress the user has already saved.
INITIAL_STATE_JSON = json.dumps({
    "owned": ["BS11-089@2","BS11-032@1","BS11-089","BS11-070","BS11-034","BS11-015","BS11-050","BS11-087","BS11-053","BS11-017","BS11-114","BS11-033","BS11-032","BS11-028","BS11-045","BS11-062","BS11-108","BS11-110","BS11-106","BS11-027","BS11-029","BS11-084","BS11-012","BS11-009","BS11-081","BS11-065","BS11-047","BS11-097","BS11-098","BS11-099","BS11-094","BS11-056","BS11-038","BS11-006","BS11-077","BS11-074","BS11-078","BS11-076","BS11-075","BS11-059","BS11-023","BS11-024","BS11-020","BS11-022","BS11-026","BS11-037","BS11-040","BS11-042","BS11-039","BS11-041","BS11-043","BS11-044","BS11-004","BS11-003","BS11-008","BS11-021","BS11-101","BS11-093","BS11-092","BS11-095","BS11-102","BS11-103","BS11-100","BS11-105","BS11-104","BS11-079","BS11-058","BS11-061","BS11-057","BS11-064","BS11-080","BS11-031","BS11-030","BS11-049","BS11-109","BS11-107","BS11-082","BS11-066","BS11-046","BS11-013","BS11-010","BS11-048","BS11-083","BS11-011","BS11-096","BS11-073","BS11-055","BS11-005","BS11-067","BS11-111"],
    "spending": [
        {"id": "s_mtl8kx4bs6sw8", "date": "2026-09-02", "amount": 55, "note": "The Dark Enchantress War - BS11"}
    ],
    "wishlist": ["BS12-100","BS12-099","BS12-098","BS12-097","BS12-096","BS12-095","BS2-063@1","BS2-063"]
})

full_html = HEAD + INITIAL_STATE_JSON + TAIL_AFTER_STATE_BEFORE_APPLOGIC + app_js + TAIL_AFTER_APPLOGIC

with open(BASE + "braverse-binder.html", "w", encoding="utf-8") as f:
    f.write(full_html)

print("Wrote braverse-binder.html:", len(full_html), "bytes")
