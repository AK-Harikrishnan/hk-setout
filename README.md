# Setout

A daily focus sheet: one task list seen through Today, Matrix and Board, with category filtering and a soft daily cap.

Site: `setout-hk` on Netlify (confirm the live URL in Netlify) · Airtable base: `appUk3r8qF6Pe1A0S` (Setout — Daily Focus) · Tier: A (single file, no build)

This repo is the source of truth. Netlify deploys `main` to production automatically, and
builds a Deploy Preview for every pull request. Nothing lives on a PC.

## What it does

One task list, four screens. Dragging a card on one screen edits an attribute that every other screen reads.

| Tab | Job |
|---|---|
| **Today** | Capture a task in one line, choose a bucket and a priority. Shows carried-over work, today's plan, tomorrow's queue and a priority-sorted pull list from the backlog. |
| **Matrix** | Urgent / important 2×2. Drag between quadrants. Untriaged captures wait in an Unsorted tray. |
| **Board** | Backlog, In progress, Done. Drag, or use the arrows. Swipes sideways on a phone. |
| **Admin** | Rename categories and their codes, set the daily cap, refresh, lock the device. |

A filter under the tabs narrows every screen to chosen categories and is remembered between visits.

## One-time setup (browser, about 5 minutes)

1. **Connect Netlify to this repo.** If the Setout site already exists: *Site configuration → Build & deploy →
   Continuous deployment → Link repository* → GitHub → this repo only → branch `main`. If not: *Add new project →
   Import an existing project → GitHub*, and name the site `setout-hk`. Build settings come from `netlify.toml`
   (no build command, publish `public`), so accept the defaults.
2. **Add environment variables.** *Site configuration → Environment variables*:

   | Key | Value | Notes |
   |---|---|---|
   | `AIRTABLE_TOKEN` | your Airtable personal access token | Tick *Contains secret values*. Scopes `data.records:read`, `data.records:write`; only the Setout base under Access (airtable.com/create/tokens) |
   | `AIRTABLE_BASE` | `appUk3r8qF6Pe1A0S` | |
   | `SETOUT_KEY` | a phrase you can type on a phone | The app's passphrase. Setout keeps this older name rather than `APP_KEY` |

   Leave them available to **all deploy contexts**, so Deploy Previews can reach Airtable too.
3. **Deploy.** *Deploys → Trigger deploy → Deploy project* (needed once, because the variables were added after the first build).
4. **Check.** Open `https://<your-site>.netlify.app/api/airtable/Tasks` in a browser. A small JSON "Wrong passphrase"
   message (401) means the gate is working. Then open the app and enter the passphrase.

## Making changes

- **With Claude:** Claude clones this repo fresh, works on a `claude/<change>` branch and opens a pull request.
  Netlify comments with a Deploy Preview link. Try it on your phone, then tap *Merge* on GitHub or say "ship it".
- **Yourself:** press `.` on this repo's GitHub page to edit in the browser, commit to a branch, open a PR.
- **Tiny fix:** say "straight to main" and Claude pushes directly.

Previews use the real Airtable base, so be careful testing deletes on one.

## If something's wrong

| You see at `/api/airtable/Tasks` | Meaning |
|---|---|
| JSON 401 "Wrong passphrase" | Correct. The gate is up. |
| JSON 500 "missing AIRTABLE_TOKEN, AIRTABLE_BASE or SETOUT_KEY" | An environment variable is missing. Add it, then *Trigger deploy*. |
| Netlify "Page not found" (404) | The function didn't deploy. Check the deploy log for "Functions bundled". |

## Rotate the passphrase

Change `SETOUT_KEY` in Netlify, then *Trigger deploy*. Every device has to unlock again.
Use **Lock this device** under Admin → Connection on any browser you no longer trust.

## Never

- Commit a token, `.env` file or the Airtable PAT. Tokens live only in Netlify's environment variables.
- Make this repo public.
