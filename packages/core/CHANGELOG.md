# @markdown-utils/msvg-core

## 0.2.0

### Minor Changes

- a4c59fe: Dynamic theming and release hardening.

  Themes resolve through a validated token model with `static`, `css-variables`, and `media-query` output modes, custom theme extension and overrides, and `themeMode`/`background` options threaded through the integrations. Accessibility gains an alt-text fallback chain, non-color status and tone labels, and salted per-diagram ids. `msvg check` validates standalone diagram files, asset mode never emits broken image references, layout includes labels and verdicts in the viewBox and wraps long words, and schema diagnostics report duplicate keys, unknown nested fields, and invalid kinds, tones, and statuses.
