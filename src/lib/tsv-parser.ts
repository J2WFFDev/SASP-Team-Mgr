export interface ParsedTSV {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseTSV(raw: string): ParsedTSV {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trimEnd());

  // Find the first non-empty line as headers
  let headerIdx = 0;
  while (headerIdx < lines.length && lines[headerIdx].trim() === "") {
    headerIdx++;
  }

  if (headerIdx >= lines.length) return { headers: [], rows: [] };

  const headers = lines[headerIdx].split("\t").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    const cols = line.split("\t");
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

export function parseDateTime(raw: string): Date | null {
  if (!raw || raw.trim() === "") return null;
  // Handle "Fri 4/24/2026 8:00 AM" format
  const cleaned = raw.replace(/^[A-Za-z]+\s+/, ""); // strip day-of-week
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}
