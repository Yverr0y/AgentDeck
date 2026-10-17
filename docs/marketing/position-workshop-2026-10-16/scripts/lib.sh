#!/usr/bin/env bash
# Helper for the AgentDeck metrics collection. Source this file, then:
#   run <id> <<'EOF'
#   <command text, executed with bash -c>
#   EOF
# Writes raw/<id>.{cmd,ts,out,err,rc} next to the final report so every
# number in the report can be traced to the exact command + UTC timestamp.
RAW=/private/tmp/claude-501/-Users-puritysb-github-AgentDeck/f3f71b44-ab9d-48f0-aba0-5395a61c76d6/scratchpad/research/raw
run() {
  local id="$1"
  local cmd
  cmd="$(cat)"
  printf '%s' "$cmd" > "$RAW/$id.cmd"
  date -u +"%Y-%m-%dT%H:%M:%SZ" > "$RAW/$id.ts"
  bash -c "$cmd" > "$RAW/$id.out" 2> "$RAW/$id.err"
  echo $? > "$RAW/$id.rc"
  printf '%-22s rc=%s out=%sB err=%sB\n' "$id" "$(cat "$RAW/$id.rc")" "$(wc -c < "$RAW/$id.out" | tr -d ' ')" "$(wc -c < "$RAW/$id.err" | tr -d ' ')"
}
