# AGENTS.md

## Commands

- `node build.mjs` — syncs `resume/*.yaml` into `data.js`, then renders `index.html`.
- There is no package manager, dev server, test suite, linter, or formatter. Verification is a successful build (`build: wrote index.html`) plus opening `index.html` directly in a browser.
- For JS edits, also run `node --check build.mjs`, `node --check lib/yaml.mjs`, and `node --check lib/resume-to-data.mjs`.

## Docs

- `README.md` — project overview, content schema, build flow, print/ATS notes. Keep it in sync with command or schema changes.

## Source of truth

- Edit `resume/*.yaml`. `data.js` and `index.html` are generated and tracked; never edit them by hand.
- `data.js` is the naming/schema reference. YAML keys must match it exactly. Do not add aliases such as `title` for `position`, `organization` for `organisation`, `items` for `bullets`, or `date` for `dates` (except `courses.date`).
- One YAML file per `data.js` section: `personal`, `summary`, `education`, `experience`, `projects`, `skills`, `courses`, `languages`, `settings`.
- `personal.yaml` contains identity and contact fields; do not recreate `social.yaml`.
- `settings.yaml` controls `highlight` and the rendered `sections` order.

## Non-obvious schema

- `summary.yaml` uses `summary: |` and becomes the top-level `summary` string. Blank lines create separate paragraphs.
- `skills.yaml` uses `skills` as a comma-separated string, not a YAML list. It is the central ATS keyword hub; keep it aligned with technologies added to experience/projects.
- `courses.yaml` is a flat list (`course`, `institution`, `date`, `link`), not `rows/left/right`.
- `projects.yaml` uses explicit `techSkills`; there is no `Stack:` bullet convention.
- `experience` and `projects` use British `organisation`. `personal` uses `position`/`address`, while entries use `location`.
- `personal.position` is the professional headline; `experience[].position` is the job title.
- YAML content is HTML-escaped by the build; HTML tags in YAML render literally.

## Build internals

- `lib/yaml.mjs` is a custom zero-dependency parser for the subset used here: block mappings/sequences, comments, quoted/plain scalars, and literal blocks (`|`, `|-`, `|+`). It does not support anchors, aliases, flow collections, folded blocks (`>`), or multi-document YAML.
- Data flow: `resume/*.yaml` -> `lib/yaml.mjs` -> `lib/resume-to-data.mjs` -> `data.js` -> `build.mjs` -> `index.html`.
- Rendering is build-time only; `index.html` has no client-side JavaScript.
- `lib/resume-to-data.mjs` exports `syncResumeData(root)`. It writes `data.js` only when content changes and rejects `skills` lists and `courses` `rows` objects.
- All generated links go through `anchor()` in `build.mjs`, which adds `target="_blank"` and `rel="noopener noreferrer"`. Use it for new anchors.
- Adding a section requires a YAML file, an entry in `YAML_FILES`, a mapper, a renderer in `build.mjs`, and inclusion in `settings.yaml`.
- `build.mjs` still has renderers for `achievements`, `publications`, and `interests`, but no YAML sources; those sections are not generated.

## Presentation

- `resume.css` is hand-written and linked from `index.html`; it is not generated.
- Design follows the Russell template: Roboto, A4 geometry, `--russell` accent color, and the first three characters of section titles highlighted.
- Screen preview is intentionally scaled with `zoom: 1.25` at viewports >= `27cm`; print resets `zoom: 1` to stay A4. Check screen and print when changing page geometry.
- `historicos/2026-10-19-ats/` is a dated archive snapshot with the old schema (`person.yaml`, `social.yaml`, `rows`, `date`, `items`). Do not treat it as source or update it during normal content edits.
