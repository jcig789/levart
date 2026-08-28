#!/bin/bash
# Levart Pre-Push Checker
# Run before every push: bash scripts/pre-push-check.sh
# Catches Obsidian store violations before the store does.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"
CSS="$ROOT/styles.css"
ERRORS=0
WARNINGS=0

red()   { echo -e "\033[0;31m$1\033[0m"; }
yellow(){ echo -e "\033[0;33m$1\033[0m"; }
green() { echo -e "\033[0;32m$1\033[0m"; }
bold()  { echo -e "\033[1m$1\033[0m"; }

bold "=== Levart Pre-Push Checker ==="
echo ""

bold "── ERRORS (store will reject) ──"

# 1. document.createElement
MATCHES=$(grep -rn "document\.createElement" "$SRC" 2>/dev/null | grep -v "//.*document\.createElement" || true)
if [ -n "$MATCHES" ]; then
  red "ERROR: document.createElement found (use el.createEl() instead)"
  echo "$MATCHES"
  ERRORS=$((ERRORS+1))
fi

# 2. eslint-disable
MATCHES=$(grep -rn "eslint-disable" "$SRC" 2>/dev/null || true)
if [ -n "$MATCHES" ]; then
  red "ERROR: eslint-disable comment found"
  echo "$MATCHES"
  ERRORS=$((ERRORS+1))
fi

# 3. window.prompt
MATCHES=$(grep -rn "window\.prompt(" "$SRC" 2>/dev/null | grep -v "^\s*//" || true)
if [ -n "$MATCHES" ]; then
  red "ERROR: window.prompt() found (use Modal instead)"
  echo "$MATCHES"
  ERRORS=$((ERRORS+1))
fi

# 4. input.type = x after creation
MATCHES=$(grep -rn "\.type\s*=\s*[\"']" "$SRC" 2>/dev/null \
  | grep -v "//\|attr.*type\|\.d\.ts" || true)
if [ -n "$MATCHES" ]; then
  red "ERROR: input.type = 'x' after creation (use createEl('input', { attr: { type: 'x' } }))"
  echo "$MATCHES"
  ERRORS=$((ERRORS+1))
fi

# 5. createEl("div") or createEl("span") — use createDiv() / createSpan()
MATCHES=$(grep -rn '\.createEl("div"\|\.createEl("span"' "$SRC" 2>/dev/null || true)
if [ -n "$MATCHES" ]; then
  red "ERROR: createEl('div') or createEl('span') found (use createDiv() / createSpan())"
  echo "$MATCHES"
  ERRORS=$((ERRORS+1))
fi

# 6. innerHTML assignment
MATCHES=$(grep -rn "innerHTML\s*=" "$SRC" 2>/dev/null | grep -v "//\|/\*" || true)
if [ -n "$MATCHES" ]; then
  red "ERROR: innerHTML = found (XSS risk and store rejection)"
  echo "$MATCHES"
  ERRORS=$((ERRORS+1))
fi

# 7. async onClick
MATCHES=$(grep -rn "\.onClick(async" "$SRC" 2>/dev/null || true)
if [ -n "$MATCHES" ]; then
  red "ERROR: async callback in onClick (wrap with void instead)"
  echo "$MATCHES"
  ERRORS=$((ERRORS+1))
fi

# 8. console.log
MATCHES=$(grep -rn "console\.log" "$SRC" 2>/dev/null || true)
if [ -n "$MATCHES" ]; then
  red "ERROR: console.log found (remove before release)"
  echo "$MATCHES"
  ERRORS=$((ERRORS+1))
fi

echo ""
bold "── WARNINGS (store may flag) ──"

# 9. !important in CSS
MATCHES=$(grep -n "!important" "$CSS" 2>/dev/null || true)
if [ -n "$MATCHES" ]; then
  yellow "WARNING: !important found in styles.css ($(echo "$MATCHES" | wc -l | tr -d ' ') instances — use higher specificity where possible)"
  WARNINGS=$((WARNINGS+1))
fi

# 10. scrollbar-width: none
MATCHES=$(grep -n "scrollbar-width:\s*none" "$CSS" 2>/dev/null || true)
if [ -n "$MATCHES" ]; then
  yellow "WARNING: scrollbar-width:none found (use ::-webkit-scrollbar { display: none } instead)"
  echo "$MATCHES"
  WARNINGS=$((WARNINGS+1))
fi

# 11. .style.x = value (inline style assignments)
MATCHES=$(grep -rn "\.style\.[a-zA-Z]* =" "$SRC" 2>/dev/null | grep -v "cssText\|//" || true)
if [ -n "$MATCHES" ]; then
  yellow "WARNING: .style.x = value found ($(echo "$MATCHES" | wc -l | tr -d ' ') instances — dynamic positioning is acceptable; display/color toggles should use CSS classes)"
  WARNINGS=$((WARNINGS+1))
fi

# 12. hardcoded hex colors in TypeScript
MATCHES=$(grep -rn "#[0-9A-Fa-f]\{6\}" "$SRC" 2>/dev/null | grep -v "//\|/\*" || true)
if [ -n "$MATCHES" ]; then
  yellow "WARNING: Hardcoded hex color in TypeScript ($(echo "$MATCHES" | wc -l | tr -d ' ') instances — use CSS variable instead)"
  WARNINGS=$((WARNINGS+1))
fi

# 13. Required files present
echo ""
bold "── REQUIRED FILES ──"
for f in main.js manifest.json styles.css versions.json README.md LICENSE; do
  if [ -f "$ROOT/$f" ]; then
    green "  ✓ $f"
  else
    red "  ✗ $f MISSING"
    ERRORS=$((ERRORS+1))
  fi
done

# 14. manifest version matches versions.json
MANIFEST_VER=$(grep '"version"' "$ROOT/manifest.json" | grep -o '"[0-9][^"]*"' | tr -d '"')
VERSIONS_HAS=$(grep "\"$MANIFEST_VER\"" "$ROOT/versions.json" || true)
if [ -z "$VERSIONS_HAS" ]; then
  red "ERROR: manifest version $MANIFEST_VER not found in versions.json"
  ERRORS=$((ERRORS+1))
else
  green "  ✓ manifest version $MANIFEST_VER in versions.json"
fi

# ── RESULT ────────────────────────────────────────────────────────────────────

echo ""
bold "=== Results ==="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  green "✓ All checks passed. Safe to push."
elif [ $ERRORS -eq 0 ]; then
  yellow "⚠ $WARNINGS warning(s). Review before pushing."
else
  red "✗ $ERRORS error(s), $WARNINGS warning(s). Fix errors before pushing."
  exit 1
fi
