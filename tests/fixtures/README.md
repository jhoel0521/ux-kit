# Fixtures

`monorepo/` contains **intentional** UX/UI and accessibility errors across stacks (React+Tailwind+Tauri, plain HTML, Jetpack Compose, Android XML, SwiftUI, Flutter, Java Swing) to test `detect.mjs`, `scan.mjs` and `render.mjs`. Do not "fix" them. Low contrast (`.muted`) and overflow at 320px (`.wide`) are only measurable with `render.mjs`. The findings `scan.mjs` must report are listed in `tests/expected/monorepo-scan.json`.

`clean/` is correct code: `scan.mjs` must report nothing there, so a new false positive fails the tests.

`regressions/` holds cases the scanner got wrong once, with the expected findings in `tests/scripts.test.mjs`.
