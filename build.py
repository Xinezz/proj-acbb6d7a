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

FONT_LINK = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600;6..96,700;6..96,800&family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;0,6..12,800;1,6..12,600&family=JetBrains+Mono:wght@500;700&display=swap">'

HEAD = (
'<!doctype html>\n'
'<html lang="en">\n'
'<head>\n'
'<meta charset="UTF-8">\n'
'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
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

# The collection state baked into the page on first load. It must mirror the
# live artifact's current cr-state (read it from the artifact before building)
# so a republish never wipes progress that has already been saved. It lives in
# initial_state.json so syncing it is a file swap, not a code edit.
with open(BASE + "initial_state.json", "r", encoding="utf-8") as f:
    _state = json.load(f)
for _key, _default in (("owned", []), ("spending", []), ("wishlist", []), ("budget", 0)):
    _state.setdefault(_key, _default)
INITIAL_STATE_JSON = json.dumps(_state, separators=(",", ":"))

full_html = HEAD + INITIAL_STATE_JSON + TAIL_AFTER_STATE_BEFORE_APPLOGIC + app_js + TAIL_AFTER_APPLOGIC

with open(BASE + "braverse-binder.html", "w", encoding="utf-8") as f:
    f.write(full_html)

print("Wrote braverse-binder.html:", len(full_html), "bytes")
