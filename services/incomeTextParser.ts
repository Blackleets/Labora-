/**
 * Deterministic income import from pasted text / CSV.
 * Works without Gemini. Never invents rows that are not parseable.
 */

export type ParsedIncomeRow = {
  platform: string;
  amount: number;
  date: string;
  retention: number;
};

const PLATFORM_ALIASES: Record<string, string> = {
  glovo: 'Glovo',
  uber: 'Uber',
  'uber eats': 'Uber Eats',
  ubereats: 'Uber Eats',
  bolt: 'Bolt',
  'bolt food': 'Bolt Food',
  justeat: 'Just Eat',
  'just eat': 'Just Eat',
  deliveroo: 'Deliveroo',
};

const normalizePlatform = (raw: string) => {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!key) return '';
  return PLATFORM_ALIASES[key] || raw.trim().replace(/\s+/g, ' ');
};

const parseEuropeanNumber = (raw: string): number | null => {
  const cleaned = raw.trim().replace(/[€$]|EUR|eur/gi, '').replace(/\s/g, '');
  if (!cleaned) return null;
  // 1.234,56 or 1234,56 or 1234.56
  let normalized = cleaned;
  if (/,/.test(cleaned) && /\./.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/,/.test(cleaned)) {
    normalized = cleaned.replace(',', '.');
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};

const parseDateToken = (raw: string): string | null => {
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  let y = Number(m[3]);
  if (y < 100) y += 2000;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const detectDelimiter = (line: string): string => {
  const counts = {
    ';': (line.match(/;/g) || []).length,
    '\t': (line.match(/\t/g) || []).length,
    ',': (line.match(/,/g) || []).length
  };
  // Prefer ; or tab when present so European decimals (120,50) stay intact.
  if (counts[';'] > 0) return ';';
  if (counts['\t'] > 0) return '\t';
  return ',';
};

const splitCsvLine = (line: string): string[] => {
  const delimiter = detectDelimiter(line);
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
};

const looksLikeHeader = (cells: string[]) => {
  const joined = cells.join(' ').toLowerCase();
  return /plataforma|platform|fecha|date|importe|amount|reten/.test(joined);
};

/**
 * Parse pasted liquidación text.
 * Supported shapes:
 * - CSV/TSV: platform,date,amount[,retention] (header optional)
 * - Line: Glovo 15/09/2026 123,45
 * - Line: Uber;2026-09-15;123.45;12
 */
export const parseIncomeTextLocally = (raw: string): ParsedIncomeRow[] => {
  const text = String(raw || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const rows: ParsedIncomeRow[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const cells = splitCsvLine(line);

    if (i === 0 && cells.length >= 3 && looksLikeHeader(cells)) {
      continue;
    }

    // CSV-like with 3+ cells
    if (cells.length >= 3) {
      const platform = normalizePlatform(cells[0]);
      const date = parseDateToken(cells[1]);
      const amount = parseEuropeanNumber(cells[2]);
      const retention = cells[3] ? parseEuropeanNumber(cells[3]) ?? 0 : 0;
      if (platform && date && amount !== null && amount > 0 && retention >= 0) {
        rows.push({ platform, amount, date, retention });
        continue;
      }
    }

    // Free line: Platform DD/MM/YYYY amount [retention]
    const free = line.match(
      /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .\-]{1,40}?)\s+(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}-\d{2}-\d{2})\s+([0-9.,]+)\s*([0-9.,]+)?$/
    );
    if (free) {
      const platform = normalizePlatform(free[1]);
      const date = parseDateToken(free[2]);
      const amount = parseEuropeanNumber(free[3]);
      const retention = free[4] ? parseEuropeanNumber(free[4]) ?? 0 : 0;
      if (platform && date && amount !== null && amount > 0 && retention >= 0) {
        rows.push({ platform, amount, date, retention });
      }
    }
  }

  // Deduplicate exact rows
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.platform}|${row.date}|${row.amount}|${row.retention}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
