# ICMS — Vibe coding for scientists

A 13-minute HTML presentation for the ICMS staff meeting, 2026-05-07.

## Run

The deck embeds live pages (LSRI presentation, SDL globe map, discoveryLabNL rings) via iframes. Iframes need same-origin, which `file://` does not provide reliably in Chrome. **Always serve the deck locally:**

```bash
./serve.sh
```

Then open **http://localhost:8000** in Chrome and press `F` for full-screen.

If you ever bypass the local server, `open index.html` works for the typed-out terminal scenes and basic content, but the live-embed scenes (rings, LSRI, globe) will be blank.

## Key bindings

| Key | Action |
|---|---|
| `Space` / `→` | Advance one beat |
| `←` | Retreat one beat |
| `Esc` | Open scene-overview grid |
| `?` | Show key-binding help |
| `Shift+Space` | Skip remainder of current terminal line |
| `F` | Browser full-screen |

Built with Claude Code in TU/e visual style.
