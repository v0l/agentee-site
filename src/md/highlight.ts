const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const span = (cls: string, text: string) => (text ? `<span class="${cls}">${escape(text)}</span>` : '');

function tomlLine(line: string): string {
  const header = /^(\s*)(\[\[?[^\]]+\]\]?)(.*)$/.exec(line);
  if (header) return escape(header[1]) + span('tk-h', header[2]) + tomlRest(header[3]);
  const key = /^(\s*)([A-Za-z0-9_."-]+)(\s*=)(.*)$/.exec(line);
  if (key) return escape(key[1]) + span('tk-k', key[2]) + escape(key[3]) + tomlRest(key[4]);
  return tomlRest(line);
}

function tomlRest(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '#') return out + span('tk-c', text.slice(i));
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < text.length && text[j] !== c) j += text[j] === '\\' ? 2 : 1;
      out += span('tk-s', text.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    const num = /^-?\d+(\.\d+)?/.exec(text.slice(i));
    if (num && !/[A-Za-z_]/.test(text[i - 1] ?? '')) {
      out += span('tk-n', num[0]);
      i += num[0].length;
      continue;
    }
    const word = /^(true|false)\b/.exec(text.slice(i));
    if (word && !/[A-Za-z_]/.test(text[i - 1] ?? '')) {
      out += span('tk-n', word[0]);
      i += word[0].length;
      continue;
    }
    out += escape(c);
    i++;
  }
  return out;
}

function shellLine(line: string): string {
  let out = '';
  let i = 0;
  let first = true;
  const prompt = /^(\s*)(\$|PS>|>)(\s)/.exec(line);
  if (prompt) {
    out += escape(prompt[1]) + span('tk-p', prompt[2]) + prompt[3];
    i = prompt[0].length;
  }
  while (i < line.length) {
    const rest = line.slice(i);
    if (rest[0] === '#' && (i === 0 || /\s/.test(line[i - 1]))) return out + span('tk-c', rest);
    if (rest[0] === '"' || rest[0] === "'") {
      const q = rest[0];
      const end = rest.indexOf(q, 1);
      const s = end < 0 ? rest : rest.slice(0, end + 1);
      out += span('tk-s', s);
      i += s.length;
      first = false;
      continue;
    }
    const ws = /^\s+/.exec(rest);
    if (ws) {
      out += ws[0];
      i += ws[0].length;
      continue;
    }
    const word = /^[^\s"']+/.exec(rest)![0];
    if (first) out += span('tk-cmd', word);
    else if (word.startsWith('-')) out += span('tk-f', word);
    else if (word === '|' || word === '<' || word === '>' || word === '&&' || word === '<<\'EOF\'') out += span('tk-p', word);
    else out += escape(word);
    first = word === '|' || word === '&&';
    i += word.length;
  }
  return out;
}

function jsonLine(line: string): string {
  return escape(line)
    .replace(/"([^"]*)"(\s*:)/g, (_m, k, c) => `<span class="tk-k">"${k}"</span>${c}`)
    .replace(/:\s*("[^"]*")/g, (m, s) => m.replace(s, `<span class="tk-s">${s}</span>`));
}

export function highlight(code: string, lang: string): string {
  const lines = code.split('\n');
  if (lang === 'toml') return lines.map(tomlLine).join('\n');
  if (lang === 'sh' || lang === 'bash' || lang === 'shell' || lang === 'console' || lang === 'powershell') {
    let heredoc = false;
    return lines
      .map(line => {
        if (heredoc) {
          if (line.trim() === 'EOF') heredoc = false;
          return escape(line);
        }
        if (line.includes("<<'EOF'") || line.includes('<<EOF')) heredoc = true;
        return shellLine(line);
      })
      .join('\n');
  }
  if (lang === 'json') return lines.map(jsonLine).join('\n');
  return escape(code);
}
