#!/bin/sh
# Claude Code PreToolUse hook: blokkerer Edit-verktøyet på CLAUDE.md.
# CLAUDE.md skal kun appendes til via Write (med eksisterende innhold bevart),
# aldri redigeres med Edit (som gjør in-place erstatninger).
#
# Installert i .claude/settings.json under hooks.PreToolUse.

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null)

if echo "$FILE" | grep -qE "(^|/)CLAUDE\.md$"; then
  echo '{"decision":"block","reason":"CLAUDE.md er append-only. Bruk Write-verktøyet og behold alt eksisterende innhold — legg kun til nye linjer."}'
  exit 0
fi

exit 0
