# Dark Contrast — a Pi Web theme

A dark, higher-contrast theme for [Pi Web](https://pi-web.dev): clearer sidebar and session lists, readable chat and tool cards, and a composer that is easy to recognise — while **every plugin keeps its own palette**.

```bash
pi install npm:pi-web-dark-contrast
```

Then reload the browser and pick **Settings → General → Theme → Dark Contrast**. Choose **Use in this browser** for one device or **Set gateway default** for everyone on that gateway.

## What it changes

- **Sidebar and sessions:** panel-style section headers, rounded rows, visible selection edge and accent, titles distinct from paths/metadata.
- **Chat:** message frames with a readable leading edge, stronger body text, separated event groups.
- **Tool cards:** distinct headers, success/error/running states that are not conveyed by colour alone.
- **Toolbar and tab strip:** selected tab is marked structurally, not only with a tint.
- **Composer:** bounded input, legible placeholder, visible focus, recognisable default submit action.
- **Layout:** on wide screens the navigation and tool panels follow the reference proportions (314px / 35vw with the original 360px minimum). Breakpoints, collapsed panels, scroll controllers and native `hidden`/`disabled` states are untouched.

Palette: background `#0D1117`, sidebar `#161B22`, panels `#1C232D`, borders `#374151`, text `#E6EDF3`, secondary text `#AAB6C5`, accent `#388BFD`, success `#3FB950`, error `#F85149`.

## Why plugins are not restyled

A selected Pi Web theme replaces the global palette, which plugins inherit. To keep plugin UIs (OpenSpec and others) on their own colours, this theme ships a byte-identical copy of the official **PI WEB Dark** palette (`assets/base-pi-web-dark.css`) and overlays only rules scoped to core components (`:host(chat-view)`, `:host(session-list)`, …). No `--pi-*` variable is redefined, and no plugin content selector is targeted.

Consequence: plugin panels look exactly as before, including any panel that differs from the screenshots.

## Compatibility

| Item | Value |
| --- | --- |
| Tested with Pi Web | `1.202611.1` (commit `98316bd`) |
| Runtime code | none — CSS-only, declarative theme, no JavaScript, no server module |
| Restart needed | no; a browser reload is enough |

Some core chrome and CodeMirror selectors are still experimental in Pi Web. After a Pi Web upgrade the appearance must be re-checked; if a future release adds new palette tokens, the bundled official baseline should be refreshed.

## Uninstall / rollback

Pick another theme in Settings (or **Use the default** in that browser), then remove the package:

```bash
pi remove npm:pi-web-dark-contrast
```

Nothing else is stored: no data migration, no session changes.

## Development

```bash
npm run build   # regenerates assets/theme.css (baseline + tokens + scoped rules)
npm test        # static checks: theme metadata, palette baseline, selector isolation, contrast
```

Files:

- `assets/base-pi-web-dark.css` — official PI WEB Dark palette, unmodified (sha256 `88b39cf2…7692`)
- `assets/tokens.css` — `--dc-*` palette used by the scoped rules
- `assets/dark-contrast.css` — core-only rules
- `assets/theme.css` — generated, the single sheet Pi Web publishes atomically
- `tests/` — static checks plus an isolated local preview harness (not shipped)
- `tests/evidence/` — verification report and screenshots

The verification covers static isolation tests, a six-viewport browser matrix, and a real-instance check that a plugin panel (OpenSpec) keeps its computed styles and all inherited `--pi-*` tokens. Screenshots and the full report are in `tests/evidence/verification.md` (Italian).

## License

MIT
