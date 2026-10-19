# CV Web — Walker Alfaro

Currículum vitae estático construido con tecnologías web y un build Node sin dependencias, inspirado en la plantilla **Russell**. El contenido vive en YAML, se sincroniza a `data.js` y se renderiza en un `index.html` listo para imprimir en A4.

## Características

- Contenido editable en YAML, separado por secciones.
- Build zero-dependency: solo Node.js, sin `npm install`.
- Generación de `data.js` e `index.html` a partir de `resume/*.yaml`.
- Estilo Russell: tipografía Roboto, geometría A4, paleta `russell-*` y resaltado de los tres primeros caracteres de cada título.
- Vista de pantalla ampliada un 25 % para mejorar la lectura; la impresión vuelve al tamaño A4.
- Enlaces generados con `target="_blank"` y `rel="noopener noreferrer"`.
- Sin JavaScript en el cliente: el HTML final es estático.
- Contenido orientado a ATS: texto plano, secciones estándar y keywords técnicas.

## Stack

| Capa | Tecnología |
|---|---|
| Build | Node.js (ESM), sin dependencias |
| Contenido | YAML |
| Render | HTML5 + CSS3 |
| Parser YAML | `lib/yaml.mjs` (subconjunto propio) |
| Tipografía | Roboto local (`assets/fonts/`) |
| Diseño | Inspirado en la plantilla Russell |

## Requisitos

- Node.js (probado con Node 24).
- No se requiere gestor de paquetes ni servidor de desarrollo.

## Inicio rápido

```bash
node build.mjs
```

Esto:

1. Lee y valida `resume/*.yaml`.
2. Regenera `data.js` si el contenido cambió.
3. Renderiza `index.html`.

Abre `index.html` directamente en el navegador. No hay servidor ni instalación adicional. Tampoco hay tests, linter ni formatter: el build es la verificación principal.

## Flujo de datos

```text
resume/*.yaml
    -> lib/yaml.mjs
    -> lib/resume-to-data.mjs
    -> data.js
    -> build.mjs
    -> index.html
```

`data.js` e `index.html` son archivos generados. No los edites a mano: modifica los YAML y vuelve a ejecutar el build.

## Estructura del proyecto

```text
.
├── build.mjs                 # Sync + render
├── lib/
│   ├── yaml.mjs              # Parser YAML sin dependencias
│   └── resume-to-data.mjs    # YAML -> data.js
├── resume/
│   ├── personal.yaml
│   ├── summary.yaml
│   ├── experience.yaml
│   ├── education.yaml
│   ├── projects.yaml
│   ├── skills.yaml
│   ├── courses.yaml
│   ├── languages.yaml
│   └── settings.yaml
├── data.js                   # Generado
├── index.html                # Generado
├── resume.css                # Estilos de pantalla e impresión
├── assets/fonts/             # Roboto
├── historicos/               # Snapshots históricos
├── AGENTS.md                 # Convenciones para agentes
└── README.md
```

## Contenido

Cada archivo YAML corresponde a una sección de `data.js`:

| Archivo | Sección | Campos principales |
|---|---|---|
| `personal.yaml` | `personal` | `firstName`, `lastName`, `position`, `address`, `email`, `mobile`, `homepage`, `linkedin`, `github` |
| `summary.yaml` | `summary` | `summary` (bloque `|`) |
| `experience.yaml` | `experience` | `position`, `organisation`, `location`, `dates`, `bullets`, `techSkills`, `softSkills` |
| `education.yaml` | `education` | `degree`, `institution`, `location`, `dates`, `bullets` |
| `projects.yaml` | `projects` | `project`, `organisation`, `location`, `dates`, `bullets`, `techSkills`, `link` |
| `skills.yaml` | `skills` | `category`, `skills` (string separado por comas) |
| `courses.yaml` | `courses` | `course`, `institution`, `date`, `link` |
| `languages.yaml` | `languages` | `language`, `proficiency` |
| `settings.yaml` | `settings` | `highlight`, `sections` |

### Reglas de esquema

- Usa exactamente los nombres de `data.js`: `position` (no `title`), `organisation` (no `organization`), `bullets` (no `items`) y `dates` (no `date`, salvo `courses.date`).
- `personal.position` es el titular profesional; `experience[].position` es el cargo.
- `skills.yaml` usa una cadena separada por comas, no una lista YAML.
- `courses.yaml` es una lista plana, no `rows/left/right`.
- Los proyectos usan `techSkills` explícito; no hay convención de bullet `Stack:`.
- El contenido YAML se escapa al renderizar: no uses etiquetas HTML.

## Configuración de secciones

`resume/settings.yaml` controla:

- `highlight`: color de acento. Valores disponibles: `russell-black`, `russell-emerald`, `russell-skyblue`, `russell-red`, `russell-purple`, `russell-pink`, `russell-orange`, `russell-nephritis`, `russell-concrete`, `russell-darknight`.
- `sections`: orden y visibilidad de las secciones.

Comenta o elimina una sección de `sections` para ocultarla.

## Añadir una sección

1. Crea `resume/<seccion>.yaml`.
2. Añade el archivo y su mapper en `lib/resume-to-data.mjs`.
3. Añade el renderer en `build.mjs`.
4. Incluye el nombre de la sección en `resume/settings.yaml`.
5. Ejecuta `node build.mjs`.

## Impresión y ATS

- La hoja usa A4 y reglas `@page` para impresión.
- En pantalla, la vista se escala con `zoom: 1.25` cuando la ventana del navegador tiene al menos `27cm`; en impresión vuelve a `zoom: 1`.
- Para postular, exporta un PDF con texto seleccionable (no una imagen escaneada).
- Revisa el texto copiándolo del PDF para confirmar que el orden y las keywords se conservan.
- Mantén el contenido en texto plano: el build escapa cualquier HTML incluido en YAML.

## Histórico

`historicos/2026-10-19-ats/` es un snapshot fechado con el esquema anterior (`person.yaml`, `social.yaml`, `rows`, `date`, `items`). Se conserva como archivo histórico; no es la fuente actual ni debe actualizarse durante cambios normales de contenido.

## Créditos

- Diseño inspirado en la plantilla **Russell** y su paleta de colores.
- Tipografía [Roboto](https://fonts.google.com/specimen/Roboto), incluida localmente en `assets/fonts/`.
