# claude_style

My Claude Code mods, one folder each, listed in `.claude-plugin/marketplace.json`.

| Mod | What it does |
| --- | --- |
| `usage-band` | Band above the prompt with live 5h/7d limits, context fill and session cost |

## Install

```
/plugin install usage-band --marketplace ctrlCVcoder/claude_style
```

## Adding a mod

Add a folder with `.claude-plugin/plugin.json` and `hooks/`, then add an entry to
`plugins` in `.claude-plugin/marketplace.json` with `"source": "./<folder>"`.
