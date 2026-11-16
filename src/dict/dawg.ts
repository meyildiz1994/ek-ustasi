/**
 * Read-only DAWG (directed acyclic word graph) for on-device word lookup (spec §7.3).
 *
 * Binary layout (little endian):
 *   bytes 0–3   magic "EKDW"
 *   bytes 4–7   version (uint32) = 1
 *   bytes 8–11  edge count N (uint32)
 *   bytes 12–15 word count (uint32)
 *   then N uint32 edges. Each node is a contiguous run of edges (siblings, sorted by letter);
 *   the root node starts at edge 0.
 *   edge = letter (5 bits, index into TR_ALPHABET) | lastSibling << 5 | endOfWord << 6 | child << 7
 *   child = index of the first edge of the child node, 0 = no children.
 *
 * Lookup is O(k · 29) for a word of k letters, independent of the dictionary size.
 */
import { TR_ALPHABET } from '../utils/tr';

export const DAWG_MAGIC = 0x5744_4b45; // "EKDW" read as little-endian uint32
export const DAWG_VERSION = 1;
export const DAWG_HEADER_BYTES = 16;

const LETTER_INDEX: ReadonlyMap<string, number> = new Map(TR_ALPHABET.map((ch, i) => [ch, i]));

export const edgeLetter = (e: number) => e & 0x1f;
export const edgeLast = (e: number) => (e & 0x20) !== 0;
export const edgeEnd = (e: number) => (e & 0x40) !== 0;
export const edgeChild = (e: number) => e >>> 7;

export function letterIndex(ch: string): number | undefined {
  return LETTER_INDEX.get(ch);
}

export class Dawg {
  private readonly edges: Uint32Array;
  readonly wordCount: number;

  constructor(buffer: ArrayBuffer | Uint8Array) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    // Copy so the edge array is 4-byte aligned whatever the source buffer offset is.
    const aligned = bytes.slice().buffer;
    const view = new DataView(aligned);
    if (bytes.byteLength < DAWG_HEADER_BYTES || view.getUint32(0, true) !== DAWG_MAGIC) {
      throw new Error('Not an EKDW dictionary');
    }
    const version = view.getUint32(4, true);
    if (version !== DAWG_VERSION) throw new Error(`Unsupported EKDW version ${version}`);
    const n = view.getUint32(8, true);
    this.wordCount = view.getUint32(12, true);
    this.edges = new Uint32Array(aligned, DAWG_HEADER_BYTES, n);
  }

  /** Index of the edge for `letter` within the node starting at `node`, or -1. */
  private find(node: number, letter: number): number {
    for (let i = node; i < this.edges.length; i++) {
      const e = this.edges[i] as number;
      const l = edgeLetter(e);
      if (l === letter) return i;
      if (l > letter || edgeLast(e)) return -1;
    }
    return -1;
  }

  /** True when `word` (lower-case, Turkish letters) is in the dictionary. */
  has(word: string): boolean {
    if (word.length === 0 || this.edges.length === 0) return false;
    let node = 0;
    let edge = -1;
    for (const ch of word) {
      const li = LETTER_INDEX.get(ch);
      if (li === undefined) return false;
      if (edge !== -1) {
        node = edgeChild(this.edges[edge] as number);
        if (node === 0) return false;
      }
      edge = this.find(node, li);
      if (edge === -1) return false;
    }
    return edgeEnd(this.edges[edge] as number);
  }

  /** All words, in Turkish alphabetical order. */
  *words(): Generator<string> {
    if (this.edges.length === 0) return;
    const edges = this.edges;
    function* walk(node: number, prefix: string): Generator<string> {
      for (let i = node; ; i++) {
        const e = edges[i] as number;
        const w = prefix + (TR_ALPHABET[edgeLetter(e)] as string);
        if (edgeEnd(e)) yield w;
        const child = edgeChild(e);
        if (child !== 0) yield* walk(child, w);
        if (edgeLast(e)) return;
      }
    }
    yield* walk(0, '');
  }

  /**
   * Every word that can be spelled with the given letters (multiset — each letter used at most as
   * many times as it appears), with length ≥ minLength. Used for bonus words and level generation.
   */
  wordsFromLetters(letters: readonly string[], minLength = 3): string[] {
    const counts = new Array<number>(TR_ALPHABET.length).fill(0);
    for (const ch of letters) {
      const li = LETTER_INDEX.get(ch);
      if (li !== undefined) counts[li] = (counts[li] as number) + 1;
    }
    const out: string[] = [];
    if (this.edges.length === 0) return out;
    const edges = this.edges;
    const walk = (node: number, prefix: string) => {
      for (let i = node; ; i++) {
        const e = edges[i] as number;
        const li = edgeLetter(e);
        if ((counts[li] as number) > 0) {
          counts[li] = (counts[li] as number) - 1;
          const w = prefix + (TR_ALPHABET[li] as string);
          if (edgeEnd(e) && w.length >= minLength) out.push(w);
          const child = edgeChild(e);
          if (child !== 0) walk(child, w);
          counts[li] = (counts[li] as number) + 1;
        }
        if (edgeLast(e)) return;
      }
    };
    walk(0, '');
    return out;
  }
}
