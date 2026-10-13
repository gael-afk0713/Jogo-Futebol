---
description: Verify a change in the real browser with playwright-cli — reproduce, inspect, fix, confirm.
---

Invoke the browser-testing-with-devtools skill (adapted in this project to use playwright-cli).

1. Serve the game locally (`python3 -m http.server 8123`) and open it: `playwright-cli open http://localhost:8123/index.html`
   - App Check: if the environment variable `APPCHECK_DEBUG_TOKEN` is set, store it before testing (`playwright-cli localstorage-set craque.appcheck.debug "$APPCHECK_DEBUG_TOKEN"`, then `playwright-cli reload`). Never print the token or commit it. Without it, App Check stays off on localhost by design.
   - Cloud tests only with guest accounts (never a real account); report the guest uids created so they can be deleted in the Firebase console.
2. For a bug: reproduce it in the browser first and capture the evidence (screenshot, console, snapshot) before changing any code.
3. For a new or changed screen: walk the affected flow at iPad portrait size (`playwright-cli resize 820 1180`), then at a phone width (375×812), taking a screenshot of each step and looking at them.
4. Check that the console is clean (`playwright-cli console`) and that network requests are as expected (`playwright-cli requests`).
5. After a fix, reload, repeat the same steps and compare the before/after screenshots.
6. Report what was checked, what broke or looked misaligned, and any console errors. Close the browser (`playwright-cli close`) and stop the local server when done.
