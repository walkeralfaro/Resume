// Sync resume/*.yaml -> data.js.
//
// The YAML files are the content source of truth, but their field names mirror
// data.js exactly: if data.js uses `position`, the YAML uses `position`.
// `syncResumeData()` parses the files, merges personal + social into the
// `personal` section and regenerates data.js.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseYaml } from "./yaml.mjs";

const YAML_FILES = {
  personal: "personal.yaml",
  summary: "summary.yaml",
  education: "education.yaml",
  experience: "experience.yaml",
  projects: "projects.yaml",
  skills: "skills.yaml",
  courses: "courses.yaml",
  languages: "languages.yaml",
  settings: "settings.yaml",
};

const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
  "courses",
  "languages",
];

export async function syncResumeData(root) {
  const resumeDir = path.join(root, "resume");
  const values = {};

  for (const [key, filename] of Object.entries(YAML_FILES)) {
    const filePath = path.join(resumeDir, filename);
    try {
      values[key] = parseYaml(await readFile(filePath, "utf8"));
    } catch (error) {
      // settings.yaml is optional: without it we use the default order.
      if (error?.code === "ENOENT" && key === "settings") continue;
      throw new Error(`No se pudo procesar ${filePath}: ${error.message}`);
    }
  }

  const data = buildData(values);
  const dataPath = path.join(root, "data.js");
  const source = renderDataModule(data);

  let previous = "";
  try {
    previous = await readFile(dataPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (previous !== source) {
    await writeFile(dataPath, source, "utf8");
  }

  return data;
}

function buildData(values) {
  const data = {
    personal: mapPersonal(values.personal),
    summary: mapSummary(values.summary),
    education: mapEducation(values.education),
    experience: mapExperience(values.experience),
    projects: mapProjects(values.projects),
    skills: mapSkills(values.skills),
    courses: mapCourses(values.courses),
    languages: mapLanguages(values.languages),
  };

  const settings = values.settings ?? {};
  const requested = Array.isArray(settings.sections)
    ? settings.sections
    : DEFAULT_SECTION_ORDER;

  const sections = [];
  for (const key of requested) {
    if (typeof key === "string" && !sections.includes(key)) {
      sections.push(key);
    }
  }

  data.settings = {
    highlight: settings.highlight ?? "russell-black",
    sections,
  };

  return data;
}

function mapPersonal(personal) {
  const personalData = personal ?? {};

  return removeNullish({
    firstName: personalData.firstName,
    lastName: personalData.lastName,
    position: personalData.position,
    address: personalData.address,
    email: personalData.email,
    mobile: personalData.mobile,
    homepage: personalData.homepage,
    linkedin: personalData.linkedin,
    github: personalData.github,
  });
}

function mapSummary(summary) {
  if (!summary) return "";
  if (typeof summary === "string") return summary.trim();
  return String(summary.summary ?? "").trim();
}

function mapEducation(items = []) {
  return asArray(items).map((item) =>
    compact({
      degree: item.degree,
      institution: item.institution,
      location: item.location,
      dates: item.dates,
      bullets: item.bullets,
    }),
  );
}

function mapExperience(items = []) {
  return asArray(items).map((item) =>
    compact({
      position: item.position,
      organisation: item.organisation,
      location: item.location,
      dates: item.dates,
      bullets: item.bullets,
      techSkills: item.techSkills,
      softSkills: item.softSkills,
    }),
  );
}

function mapProjects(items = []) {
  return asArray(items).map((item) =>
    compact({
      project: item.project,
      organisation: item.organisation,
      location: item.location,
      dates: item.dates,
      bullets: item.bullets,
      techSkills: item.techSkills,
      softSkills: item.softSkills,
      link: item.link,
    }),
  );
}

function mapSkills(items = []) {
  return asArray(items).map((item) => {
    if (Array.isArray(item.skills)) {
      throw new Error(
        'resume/skills.yaml: "skills" debe ser una cadena separada por comas, no una lista',
      );
    }

    return compact({
      category: item.category,
      skills: item.skills,
    });
  });
}

function mapCourses(items = []) {
  if (items !== null && items !== undefined && !Array.isArray(items)) {
    throw new Error(
      'resume/courses.yaml: debe ser una lista de cursos, no un objeto con "rows"',
    );
  }

  return asArray(items).map((item) =>
    compact({
      course: item.course,
      institution: item.institution,
      date: item.date,
      link: item.link,
    }),
  );
}

function mapLanguages(items = []) {
  return asArray(items).map((item) =>
    compact({
      language: item.language,
      proficiency: item.proficiency,
    }),
  );
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

function removeNullish(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  );
}

function renderDataModule(data) {
  const body = JSON.stringify(data, null, 2)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return [
    "// GENERATED FILE — do not edit by hand.",
    "// Source: resume/*.yaml — regenerate with `node build.mjs`.",
    "",
    `export default ${body};`,
    "",
  ].join("\n");
}
