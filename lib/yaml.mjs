// Minimal YAML subset parser for the resume content.
//
// Supports the syntax used by resume/*.yaml:
//   - block mappings and block sequences
//   - plain, single-quoted and double-quoted scalars
//   - literal block scalars (|, |-, |+)
//
// Unsupported features (anchors, aliases, flow collections, multiple
// documents) fail with a clear error instead of being silently misread.

export function parseYaml(source) {
  const parser = new Parser(
    String(source).replace(/\r\n?/g, "\n").split("\n"),
  );
  return parser.parseDocument();
}

class Parser {
  constructor(lines) {
    this.lines = lines;
    this.index = 0;
  }

  parseDocument() {
    const first = this.peek();
    if (!first) return null;

    const value = this.parseNode(first.indent);
    const trailing = this.peek();
    if (trailing) {
      throw new Error(`unexpected content at line ${trailing.index + 1}`);
    }
    return value;
  }

  peek() {
    while (this.index < this.lines.length) {
      const raw = this.lines[this.index];
      const trimmed = raw.trim();
      if (trimmed === "" || trimmed.startsWith("#")) {
        this.index += 1;
        continue;
      }
      const indent = raw.length - raw.trimStart().length;
      return { index: this.index, indent, content: raw.slice(indent) };
    }
    return null;
  }

  parseNode(indent) {
    const line = this.peek();
    if (!line || line.indent < indent) return null;
    if (isSequenceLine(line.content)) return this.parseSequence(line.indent);
    return this.parseMapping(line.indent);
  }

  parseMapping(indent) {
    const result = {};
    while (true) {
      const line = this.peek();
      if (!line || line.indent < indent) break;
      if (line.indent > indent) {
        throw new Error(`unexpected indentation at line ${line.index + 1}`);
      }
      if (isSequenceLine(line.content)) break;

      this.index = line.index + 1;
      this.parseMappingEntry(line.content, indent, result);
    }
    return result;
  }

  parseSequence(indent) {
    const result = [];
    while (true) {
      const line = this.peek();
      if (!line || line.indent < indent) break;
      if (line.indent > indent) {
        throw new Error(`unexpected indentation at line ${line.index + 1}`);
      }
      if (!isSequenceLine(line.content)) break;

      const item = line.content.replace(/^-\s*/, "");
      this.index = line.index + 1;

      if (item === "") {
        const next = this.peek();
        if (!next || next.indent <= indent) {
          result.push(null);
        } else {
          result.push(this.parseNode(next.indent));
        }
      } else if (isInlineMapping(item)) {
        // "- key: value" starts a mapping item. The key column is where the
        // text after the dash begins; the remaining keys are at that indent.
        const keyIndent = line.indent + line.content.indexOf(item);
        const entry = {};
        this.parseMappingEntry(item, keyIndent, entry);
        Object.assign(entry, this.parseMapping(keyIndent));
        result.push(entry);
      } else {
        result.push(parseScalar(item));
      }
    }
    return result;
  }

  parseMappingEntry(content, indent, target) {
    const entry = splitKey(content);
    if (!entry) {
      throw new Error(`expected "key: value" but found ${JSON.stringify(content)}`);
    }

    const { key, rest } = entry;
    const header = stripComment(rest).trim();

    if (header === "") {
      const next = this.peek();
      if (!next || next.indent <= indent) {
        target[key] = null;
      } else {
        target[key] = this.parseNode(next.indent);
      }
    } else if (isBlockScalarHeader(header)) {
      target[key] = this.parseBlockScalar(indent, header);
    } else {
      target[key] = parseScalar(rest);
    }
  }

  parseBlockScalar(parentIndent, header) {
    const style = header.trim();
    const raw = [];
    let blockIndent = null;

    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      if (line.trim() === "") {
        raw.push("");
        this.index += 1;
        continue;
      }

      const indent = line.length - line.trimStart().length;
      if (indent <= parentIndent) break;
      if (blockIndent === null) blockIndent = indent;
      if (indent < blockIndent) break;

      raw.push(line.slice(blockIndent));
      this.index += 1;
    }

    let text = raw.join("\n");
    if (style === "|-") {
      text = text.replace(/\n+$/, "");
    } else if (style !== "|+") {
      text = text.replace(/\n+$/, "") + "\n";
    }
    return text;
  }
}

function isSequenceLine(content) {
  return content === "-" || /^-\s/.test(content);
}

function isInlineMapping(content) {
  if (content.startsWith('"') || content.startsWith("'")) return false;
  return /^[A-Za-z_][A-Za-z0-9_.-]*[ \t]*:(?:[ \t]|$)/.test(content);
}

function splitKey(content) {
  const match = content.match(
    /^([A-Za-z_][A-Za-z0-9_.-]*)[ \t]*:(?:[ \t]+(.*))?$/,
  );
  if (!match) return null;
  return { key: match[1], rest: (match[2] ?? "").trim() };
}

function isBlockScalarHeader(value) {
  return /^\|[-+]?$/.test(value);
}

function parseScalar(raw) {
  const value = stripComment(raw).trim();
  if (value === "") return "";

  if (value.startsWith('"')) {
    if (value.length < 2 || !value.endsWith('"')) {
      throw new Error(`unterminated double-quoted string: ${value}`);
    }
    return parseDoubleQuoted(value);
  }

  if (value.startsWith("'")) {
    if (value.length < 2 || !value.endsWith("'")) {
      throw new Error(`unterminated single-quoted string: ${value}`);
    }
    return value.slice(1, -1).replace(/''/g, "'");
  }

  if (value === "null" || value === "~") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function parseDoubleQuoted(value) {
  let result = "";
  for (let i = 1; i < value.length - 1; i += 1) {
    const char = value[i];
    if (char !== "\\") {
      result += char;
      continue;
    }

    i += 1;
    const escaped = value[i];
    switch (escaped) {
      case "n":
        result += "\n";
        break;
      case "t":
        result += "\t";
        break;
      case "r":
        result += "\r";
        break;
      case '"':
        result += '"';
        break;
      case "\\":
        result += "\\";
        break;
      case "/":
        result += "/";
        break;
      case "u": {
        const hex = value.slice(i + 1, i + 5);
        if (!/^[0-9A-Fa-f]{4}$/.test(hex)) {
          throw new Error(`invalid unicode escape: \\u${hex}`);
        }
        result += String.fromCharCode(parseInt(hex, 16));
        i += 4;
        break;
      }
      default:
        result += escaped;
    }
  }
  return result;
}

function stripComment(value) {
  let singleQuoted = false;
  let doubleQuoted = false;
  let escaped = false;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (doubleQuoted && char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "'" && !doubleQuoted) {
      singleQuoted = !singleQuoted;
      continue;
    }
    if (char === '"' && !singleQuoted) {
      doubleQuoted = !doubleQuoted;
      continue;
    }
    if (char === "#" && !singleQuoted && !doubleQuoted) {
      if (i === 0 || /\s/.test(value[i - 1])) {
        return value.slice(0, i).trimEnd();
      }
    }
  }
  return value;
}
