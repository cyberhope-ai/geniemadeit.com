#!/bin/bash
# usage: watch_pack.sh <N>  (watches /tmp/gen_batch<N>.log for BATCH<N>_DONE, then pulls)
SP=/tmp/claude-1000/-home-cyberhope-Documents-pcos-agent/ed382083-46c7-4b2d-8dde-91a4065bac24/scratchpad
N="$1"
for i in $(seq 1 90); do
  DONE=$(timeout 15 ssh -o ConnectTimeout=12 -o BatchMode=yes cyberhope@192.168.1.6 "grep -q BATCH${N}_DONE /tmp/gen_batch${N}.log 2>/dev/null && echo yes || echo no" 2>/dev/null)
  NC=$(timeout 15 ssh -o ConnectTimeout=12 -o BatchMode=yes cyberhope@192.168.1.6 "ls /tmp/batch${N}_out/*/*.png 2>/dev/null | wc -l" 2>/dev/null)
  echo "[check $i] done=$DONE n=$NC"
  if [ "$DONE" = "yes" ]; then
    rm -rf "$SP/batch${N}_out"; mkdir -p "$SP/batch${N}_out"
    scp -o ConnectTimeout=20 -q -r cyberhope@192.168.1.6:/tmp/batch${N}_out/* "$SP/batch${N}_out/" 2>/dev/null
    echo "PULLED $(ls "$SP"/batch${N}_out/*/*.png 2>/dev/null | wc -l) images"; echo "=== BATCH${N} WATCH DONE ==="; exit 0
  fi
  sleep 30
done
echo "=== BATCH${N} WATCH TIMEOUT ==="
