# CV optimizado para ATS — 2026-10-19

Snapshot del contenido de `resume/` optimizado para sistemas de seguimiento de candidatos (ATS).

## Contenido

- Archivos `.yaml` optimizados (misma estructura que el original).
- `original/`: copia del contenido previo, sin cambios, para poder revertir.

## Cambios aplicados

### `summary.yaml`
- Eliminadas etiquetas HTML (`<em>`), que algunos ATS interpretan como texto literal o rompen el párrafo.
- Reescrito en tercera persona implícita, sin “performantes” ni anglicismos innecesarios.
- Incluidos términos clave para búsqueda: Full-Stack, React, Next.js, TypeScript, Node.js, NestJS, APIs REST, PostgreSQL, MySQL, MongoDB, Prisma, Sequelize, Mongoose, Laravel, PHP, Java, Spring Boot, Docker, Git.

### `experience.yaml`
- Bullets reescritos empezando con verbos de acción (Desarrollo, Implementación, Construcción, Diseño, Gestión, Liderazgo, Dirección).
- Tecnologías integradas en el texto de cada logro, no solo en una lista aparte.
- Puestos y fechas estandarizados (`Mes Año - Mes Año`).
- Eliminadas frases en primera persona y ambigüedades.
- Conservados únicamente datos verificables; no se inventaron métricas.

### `projects.yaml`
- Cada proyecto pasó a ser una entrada independiente con nombre propio (mejor lectura para ATS).
- Añadida una línea `Stack:` en cada proyecto con las tecnologías usadas.
- Descripciones orientadas a funcionalidad, tecnologías y resultado.

### `skills.yaml`
- Nombres de tecnologías estandarizados (`Tailwind CSS`, `shadcn/ui`, `JavaScript (ES6+)`, etc.) para mejorar la coincidencia exacta.
- Añadidas tecnologías ya evidenciadas en la experiencia/educación: HTML5, CSS3, React Router, APIs REST, Eloquent ORM, GitHub, Filament.
- Nueva categoría de competencias: responsive, mobile-first, accesibilidad, Clean Code, arquitectura, gestión y liderazgo.

### `education.yaml`
- Títulos y fechas normalizados.
- Bullets con palabras clave del programa (full-stack, Java, Spring Boot, APIs RESTful, MySQL).
- “Titulado en Ingeniería Electrónica” simplificado a “Ingeniería Electrónica”, que es el término que buscan los ATS.

### `courses.yaml`
- Certificaciones ordenadas de más reciente a más antigua.
- Nombres de cursos normalizados y “Microsoft” cambiado a “Microsoft Learn” (nombre correcto de la plataforma).

### `person.yaml` y `social.yaml`
- Titular con palabras clave del perfil.
- URLs completas con `https://` para que los ATS las detecten como enlaces.
- Ubicación estandarizada (`Lima, Perú`).

### `languages.yaml`
- Formato simple y consistente (`Nativo`, `Intermedio`).

## Recomendaciones para la exportación final

El contenido ya está optimizado, pero el ATS también evalúa el archivo que se sube:

1. Exportar en PDF con texto seleccionable o en DOCX. Evitar imágenes/escaneos.
2. Usar una sola columna. Las tablas y las columnas dobles (como la plantilla HTML actual) pueden desordenar la lectura.
3. Evitar foto, iconos, gráficos y cajas de texto.
4. Mantener encabezados estándar: Perfil, Experiencia, Educación, Proyectos, Habilidades, Certificaciones, Idiomas.
5. Nombre de archivo sugerido: `Walker-Alfaro-CV-Desarrollador-FullStack.pdf`.
6. Revisar el texto extraído del PDF antes de enviarlo (copiar/pegar en un editor y comprobar que el orden sea correcto).

## Nota sobre fechas de proyectos

La fecha `Abr 2023 - Actualidad` de los proyectos individuales corresponde al periodo del portfolio que los agrupa. Si cada proyecto tiene una fecha propia, conviene actualizarla para mayor precisión.
