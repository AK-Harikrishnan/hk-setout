# Setout — context for Claude

Hari's personal daily-focus app. Read this before changing anything. Stack rules come from the
`personal-app-builder` skill; this file records what is specific to Setout.

## Shape

- **Tier A**: `public/index.html` (React 18 UMD + Babel standalone, no build) and one Netlify Function.
- **Function**: `netlify/functions/airtable.js`, an ES module exporting `config = { path: "/api/airtable/*" }`.
  Constant-time passphrase check, allowlist of tables `Tasks` and `Categories`, methods GET/POST/PATCH/DELETE,
  record-ID shape check.
- **Env vars (Netlify only)**: `AIRTABLE_TOKEN`, `AIRTABLE_BASE`, `SETOUT_KEY`. This app keeps the older
  `SETOUT_KEY` name. Do not rename it unless Hari asks to migrate.
- **Browser sends** `X-Setout-Key`. localStorage keys: `setout.cfg.v2` (passphrase), `setout.cap`, `setout.filter`.
- **Airtable**: base `appUk3r8qF6Pe1A0S` "Setout — Daily Focus". Tables `Categories` (`tbldSvI155wjXDblp`) and
  `Tasks` (`tblyREBgvNkCpMYly`). Writes use `typecast: true`, so field and select names must match exactly.

## Data model

`Tasks`: Title, Cat, Seq, Notes, Important, Urgent, Sorted, Status (Backlog / In progress / Done),
Planned For (date, empty = backlog), Kind (Task / Thinking), Last Reviewed, Completed On, Created.
`Categories`: Name, Code, Order.

- A task's category is the **Code text** in `Cat`, not a linked record. The MCP could not create a link field.
  The reference shown on cards is `Cat` + `Seq`, for example `LHR-003`.
- Renaming a category changes only `Name`. Changing a code re-letters every task in it (batched, 10 per call).
- Quadrant is derived: `Important` + `Urgent`. `Sorted = false` means untriaged and appears in the Matrix Unsorted tray.

## Behaviours that must not regress

These came from Hari's feedback. Each fixed a real gap.

- **Every state is reachable and visible.** Park is selectable at capture (four named quadrant chips, none = Unsorted).
  Tasks pushed to a future date appear under **Tomorrow** on the Today tab, so nothing vanishes.
- **Counters show real counts.** Focus reads `done/planned`, an em dash when nothing is planned, red when planned
  exceeds the cap. The cap is only a warning, never the denominator.
- **Buttons carry words.** Today actions read `Tmrw` / `Backlog` / `Reviewed`. No bare icons for actions.
- **Thinking tasks cycle.** `Kind = Thinking` shows `Reviewed` (stamps Last Reviewed, returns to backlog) instead of `Backlog`.
- **Tabs in order:** Today, Matrix, Board, Admin. Capture lives on Today.
- **Global category filter** sits under the tabs on every tab except Admin and persists. It filters a derived `shown`
  list; the full `tasks` list is still used for numbering, admin counts and category moves, so filtering never corrupts data.
- **Mobile:** Board is a swipe rail below 760px; Matrix stays a true 2×2 down to phone width.
- **Hooks stay above the early returns** in `App`, or React throws on first render.
- Refresh is skipped while writes are pending, so a background fetch can't overwrite optimistic edits.
- Fonts: an Aptos stack with Segoe UI, IBM Plex and Barlow fallbacks. Aptos is not on web CDNs, so phones fall back.

## Open items, in priority order

1. **Delete has no confirmation.** Hari's standing rule is never to delete without confirming. The edit sheet's
   Delete button and the category bin remove straight away. Add a confirm step before shipping anything else.
2. **No `APP_VERSION`.** `check_client.py` expects one. Add the constant and show it in the footer.
3. **Seq can collide** if two devices capture into the same category within one refresh window. Low risk for one user.
4. **Aptos fallback.** Decide whether to pick a web-licensed match so laptop and phone look identical.
5. **Logo.** None yet. Hari's standing collateral layout puts a logo bottom right; the Setout mark (ink square, white
   inner frame, cobalt bar) is what the guide uses.
6. A stray empty base named "Setout" (`appsytQeavnb4i1WC`) was left by a first attempt. Hari should delete it.
7. The default categories (AtkinsRéalis, Heathrow, Team, Personal) are seeded by the app on first load if the
   Categories table is empty. They were never inserted directly.

## Making a change

Clone fresh, branch `claude/<change>`, bump `APP_VERSION`, run `python3 check_client.py <dir>`, open a PR,
give Hari the Deploy Preview link, ship only when he says so. Never `netlify deploy --prod` from a folder.
