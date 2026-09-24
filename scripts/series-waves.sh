#!/bin/zsh
# Renders the series in waves: each wave's Blender clips, then its shorts, while the next
# wave's clips render. Each wave's render records (series/renders/) are committed before the
# next wave starts, so every render records a clean tree. Logs go to out/waves/.
#
#   scripts/series-waves.sh 9,14,17,19,20 27,28,31 ...   # one comma list per wave
set -e
cd "${0:A:h}/.."
mkdir -p out/waves

commit() {
  git add series/renders
  git diff --cached --quiet && return
  git commit -qm "Record the renders of $1

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016Z9BbdP28sZoh3uZowjvws"
  echo "committed $(git log --oneline -1)"
}

render=""
last=""
for wave in "$@"; do
  echo "clips for $wave"
  npm run -s series:clips -- $wave > "out/waves/clips-$wave.txt" 2>&1 || echo "some clips for $wave failed; see out/waves/clips-$wave.txt"
  if [[ -n $render ]]; then
    wait $render || echo "render of $last failed; see out/waves/series-$last.txt"
    commit $last
  fi
  echo "render $wave"
  npm run -s series -- $wave > "out/waves/series-$wave.txt" 2>&1 &
  render=$!
  last=$wave
done
wait $render || echo "render of $last failed; see out/waves/series-$last.txt"
commit $last
grep -h "share.mp4\|rror" out/waves/series-*.txt
