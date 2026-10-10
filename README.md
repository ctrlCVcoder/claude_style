# usage-band

A Claude Code mod: a band above the prompt showing live usage — 5h and 7d
rate-limit windows with reset times, context fill and session cost. Updates
whenever the engine measures the session.

```
✦ usage  5h ▰▰▰▱▱▱▱▱▱▱ 23% ↻ 2h 14m  │  7d ▰▰▰▰▱▱▱▱▱▱ 41% ↻ 3d 5h  │  ctx ▰▱▱▱▱▱▱▱▱▱ 18%  │  spent $0.42
```

## Install

```
/plugin install usage-band --marketplace ctrlCVcoder/usage-band
```

Rate-limit windows only appear on a Claude subscription, after the first response.
