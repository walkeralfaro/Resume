#!/usr/bin/env node
// Zero-dependency renderer: resume/*.yaml -> data.js -> index.html
//
// Usage: node build.mjs
//
// Edit resume/*.yaml, then run this script. `data.js` and `index.html` are
// generated. Do not edit them by hand.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncResumeData } from "./lib/resume-to-data.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

// Fallback order used when data.settings.sections is not defined.
const DEFAULT_SECTION_ORDER = [
  "summary",
  "education",
  "experience",
  "projects",
  "skills",
  "courses",
  "achievements",
  "publications",
  "interests",
  "languages",
];

// Mirrors the russell-* palette defined by the russell LaTeX template.
const RUSSELL_COLORS = {
  "russell-emerald": "#00A388",
  "russell-skyblue": "#0395DE",
  "russell-red": "#DC3522",
  "russell-purple": "#A32CC4",
  "russell-pink": "#EF4089",
  "russell-orange": "#FF6138",
  "russell-nephritis": "#27AE60",
  "russell-concrete": "#95A5A6",
  "russell-darknight": "#131A28",
  "russell-black": "#000000",
};

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

const safeHref = (href) =>
  /^(https?:|mailto:|tel:)/i.test(String(href)) ? esc(href) : "#";

const anchor = (href, label) =>
  `<a href="${safeHref(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

const icon = {
  phone:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z"/></svg>',
  email:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  homepage:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.09h4.56V23H.22V8.09zM8.34 8.09h4.37v2.04h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 6.99V23h-4.56v-6.94c0-1.66-.03-3.79-2.31-3.79-2.31 0-2.66 1.81-2.66 3.67V23H8.34V8.09z"/></svg>',
};

try {
  await syncResumeData(ROOT);
} catch (error) {
  console.error(`build: failed to sync resume/*.yaml into data.js: ${error.message}`);
  process.exit(1);
}

let data;
try {
  // The query string bypasses Node's module cache so the freshly generated
  // data.js is used on every run.
  const dataUrl = new URL("./data.js", import.meta.url);
  dataUrl.searchParams.set("v", String(Date.now()));
  ({ default: data } = await import(dataUrl.href));
} catch (error) {
  console.error(`build: failed to load ./data.js: ${error.message}`);
  process.exit(1);
}

if (!data || typeof data !== "object") {
  console.error("build: ./data.js must export an object");
  process.exit(1);
}

function fail(message) {
  console.error(`build: ${message}`);
  process.exit(1);
}

function section(title, body) {
  // The russell template highlights only the first three characters of a heading.
  return `<section class="cv-section">
<h2 class="cv-section-title">${esc(title)}</h2>
${body}
</section>`;
}

function paragraphSection(title, text) {
  const paragraphs = String(text ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  const body = paragraphs
    .map((paragraph) => `<p class="cv-paragraph">${esc(paragraph)}</p>`)
    .join("\n");

  return section(title, body);
}

function bulletList(bullets, techSkills, softSkills) {
  const items = (bullets ?? []).map((bullet) => `<li>${esc(bullet)}</li>`);
  if (techSkills) {
    items.push(`<li><strong>Technical Skills:</strong> ${esc(techSkills)}</li>`);
  }
  if (softSkills) {
    items.push(`<li><strong>Soft Skills:</strong> ${esc(softSkills)}</li>`);
  }
  return items.length
    ? `<ul class="cv-items">
${items.join("\n")}
</ul>`
    : "";
}

function entry({ title, subtitle, location, dates, bullets, techSkills, softSkills, link, linkLabel = "Ver" }) {
  const locationHtml = [
    location ? esc(location) : "",
    link ? anchor(link, linkLabel) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return `<article class="cv-entry">
<div class="cv-entry-head">
<span class="cv-entry-title">${esc(title)}</span>
<span class="cv-entry-location">${locationHtml}</span>
</div>
<div class="cv-entry-head">
<span class="cv-entry-position">${esc(subtitle)}</span>
<span class="cv-entry-date">${esc(dates)}</span>
</div>
${bulletList(bullets, techSkills, softSkills)}
</article>`;
}

function entriesSection(title, entries, mapEntry) {
  return section(title, entries.map((item) => entry(mapEntry(item))).join("\n"));
}

function rowsSection(title, items, renderRow) {
  return section(
    title,
    `<div class="cv-rows">
${items.map(renderRow).join("\n")}
</div>`,
  );
}

const row = (label, value) => `<div class="cv-row">
<div class="cv-row-label">${esc(label)}</div>
<div class="cv-row-value">${value}</div>
</div>`;

const withProtocol = (value) =>
  /^https?:\/\//i.test(String(value)) ? String(value) : `https://${value}`;

const githubUrl = (value) => {
  const raw = String(value).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(www\.)?github\.com\//i.test(raw)) return `https://${raw}`;
  return `https://github.com/${raw.replace(/^@/, "")}`;
};

const linkedinUrl = (value) => {
  const raw = String(value).trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(www\.)?linkedin\.com\//i.test(raw)) return `https://${raw}`;
  return `https://www.linkedin.com/in/${raw.replace(/^\/+|\/+$/g, "")}`;
};

const displayUrl = (value) =>
  String(value).replace(/^https?:\/\//i, "").replace(/\/$/, "");

function header(personal) {
  const name = `<span class="cv-first-name">${esc(personal.firstName)}</span> <span class="cv-last-name">${esc(personal.lastName)}</span>`;
  const contact = [];

  if (personal.mobile) {
    contact.push(
      `<li>${icon.phone}${anchor(`tel:${personal.mobile}`, personal.mobile)}</li>`,
    );
  }
  if (personal.email) {
    contact.push(
      `<li>${icon.email}${anchor(`mailto:${personal.email}`, personal.email)}</li>`,
    );
  }
  if (personal.homepage) {
    contact.push(
      `<li>${icon.homepage}${anchor(withProtocol(personal.homepage), displayUrl(personal.homepage))}</li>`,
    );
  }
  if (personal.github) {
    contact.push(
      `<li>${icon.github}${anchor(githubUrl(personal.github), displayUrl(personal.github))}</li>`,
    );
  }
  if (personal.linkedin) {
    contact.push(
      `<li>${icon.linkedin}${anchor(linkedinUrl(personal.linkedin), displayUrl(personal.linkedin))}</li>`,
    );
  }

  return `<header class="cv-header">
${personal.photo ? `<img class="cv-photo" src="${esc(personal.photo)}" alt="">` : ""}
<h1 class="cv-name">${name}</h1>
${personal.position ? `<p class="cv-position">${esc(personal.position)}</p>` : ""}
${personal.address ? `<p class="cv-address">${esc(personal.address)}</p>` : ""}
${contact.length ? `<ul class="cv-contact">${contact.join("")}</ul>` : ""}
</header>`;
}

function achievementsSection(title, items) {
  return section(
    title,
    `<div class="cv-honors">
${items
  .map(
    (item) => `<div class="cv-honor">
<span class="cv-honor-date">${esc(item.date)}</span>
<span class="cv-honor-title"><span class="cv-honor-award">${esc(item.award)}</span><span class="cv-honor-event">, ${esc(item.event)}</span></span>
<span class="cv-honor-location">${esc(item.location)}</span>
</div>`,
  )
  .join("\n")}
</div>`,
  );
}

function publicationsSection(title, items) {
  const order = [];
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.type)) {
      groups.set(item.type, []);
      order.push(item.type);
    }
    groups.get(item.type).push(item);
  }

  const body = order
    .map(
      (type) => `<h3 class="cv-subsection">${esc(type)}</h3>
${groups
  .get(type)
  .map(
    (item) => `<article class="cv-publication">
<p class="cv-pub-title">${esc(item.title)}</p>
<p class="cv-pub-authors">${esc(item.authors)}</p>
<p class="cv-pub-venue">${esc(item.venue)}, ${esc(item.year)}</p>
</article>`,
  )
  .join("\n")}`,
    )
    .join("\n");

  return section(title, body);
}

const renderers = {
  summary: (value) => paragraphSection("Professional Summary", value),
  education: (value) =>
    entriesSection("Education", value, (item) => ({
      title: item.institution,
      subtitle: item.degree,
      location: item.location,
      dates: item.dates,
      bullets: item.bullets,
    })),
  experience: (value) =>
    entriesSection("Relevant Experience", value, (item) => ({
      title: item.organisation,
      subtitle: item.position,
      location: item.location,
      dates: item.dates,
      bullets: item.bullets,
      techSkills: item.techSkills,
      softSkills: item.softSkills,
    })),
  projects: (value) =>
    entriesSection("Projects", value, (item) => ({
      title: item.project,
      subtitle: item.organisation,
      location: item.location,
      dates: item.dates,
      bullets: item.bullets,
      techSkills: item.techSkills,
      softSkills: item.softSkills,
      link: item.link,
      linkLabel: "Ver proyecto",
    })),
  skills: (value) =>
    rowsSection("Skills", value, (item) => row(item.category, esc(item.skills))),
  courses: (value) =>
    entriesSection("Certifications", value, (item) => ({
      title: item.course,
      subtitle: item.institution,
      location: item.location,
      dates: item.date,
      link: item.link,
      linkLabel: "Certificado",
    })),
  achievements: (value) => achievementsSection("Achievements", value),
  publications: (value) => publicationsSection("Publications", value),
  interests: (value) =>
    rowsSection("Interests", value, (item) => {
      const links = (item.links ?? [])
        .map(
          (link) => anchor(link.href, link.label),
        )
        .join(", ");
      return row(
        item.interest,
        `${esc(item.description)}${links ? ` (${links})` : ""}`,
      );
    }),
  languages: (value) =>
    rowsSection("Languages", value, (item) =>
      row(item.language, esc(item.proficiency)),
    ),
};

const highlight =
  RUSSELL_COLORS[data.settings?.highlight] ?? RUSSELL_COLORS["russell-black"];

const configuredSections = data.settings?.sections;
const sectionOrder =
  configuredSections === undefined ? DEFAULT_SECTION_ORDER : configuredSections;

if (!Array.isArray(sectionOrder)) {
  fail("settings.sections must be an array of section names");
}

const seenSections = new Set();
for (const key of sectionOrder) {
  if (typeof key !== "string" || !Object.hasOwn(renderers, key)) {
    fail(`unknown section "${key}" in settings.sections`);
  }
  if (seenSections.has(key)) {
    fail(`duplicate section "${key}" in settings.sections`);
  }
  seenSections.add(key);

  const value = data[key];
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  ) {
    fail(`section "${key}" is listed in settings.sections but has no data`);
  }
}

const sections = sectionOrder
  .map((key) => renderers[key](data[key]))
  .join("\n");

const title = `${data.personal.firstName} ${data.personal.lastName} — Curriculum Vitae`;

const html = `<!DOCTYPE html>
<!-- GENERATED FILE — do not edit by hand. Run: node build.mjs -->
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="resume.css">
<style>:root { --russell: ${highlight}; }</style>
</head>
<body>
<main class="cv-page">
${header(data.personal)}
${sections}
</main>
</body>
</html>
`;

try {
  await writeFile(new URL("./index.html", import.meta.url), html, "utf8");
} catch (error) {
  console.error(`build: failed to write index.html: ${error.message}`);
  process.exit(1);
}

console.log("build: wrote index.html");
