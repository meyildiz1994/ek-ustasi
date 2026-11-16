/** Parser for Zemberek lexicon lines: `kitap`, `saat [A:InverseHarmony, NoVoicing]`, `bugün [P:Noun, Time]`. */

export interface ZemberekEntry {
  /** Lemma as written (may contain â/î/û, upper case for proper nouns). */
  lemma: string;
  /** Primary POS (Noun, Adj, Adv, Verb, …). Unannotated words are Noun, or Verb when ending -mak/-mek. */
  pos: string;
  /** Secondary POS (Time, Pers, Card …). */
  secondaryPos: string[];
  attributes: string[];
  /** Homograph index (Index:1 …), 0 when absent. */
  index: number;
}

export function parseLine(raw: string): ZemberekEntry | null {
  const line = raw.trim();
  if (line.length === 0 || line.startsWith('##')) return null;
  const open = line.indexOf('[');
  const lemma = (open === -1 ? line : line.slice(0, open)).trim();
  if (lemma.length === 0) return null;
  const meta = open === -1 ? '' : line.slice(open + 1, line.lastIndexOf(']'));

  let pos = '';
  let secondaryPos: string[] = [];
  let attributes: string[] = [];
  let index = 0;
  for (const group of meta.split(';')) {
    const colon = group.indexOf(':');
    if (colon === -1) continue;
    const key = group.slice(0, colon).trim();
    const values = group
      .slice(colon + 1)
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    if (key === 'P') {
      pos = values[0] ?? '';
      secondaryPos = values.slice(1);
    } else if (key === 'A') {
      attributes = values;
    } else if (key === 'Index') {
      index = Number(values[0] ?? 0);
    }
  }
  if (pos === '') pos = /m[ae]k$/.test(lemma) && lemma.length > 3 ? 'Verb' : 'Noun';
  return { lemma, pos, secondaryPos, attributes, index };
}

export function parseDictionary(text: string): ZemberekEntry[] {
  const out: ZemberekEntry[] = [];
  for (const line of text.split('\n')) {
    const e = parseLine(line);
    if (e) out.push(e);
  }
  return out;
}
