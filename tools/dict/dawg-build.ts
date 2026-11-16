/**
 * Builds the EKDW binary (see src/dict/dawg.ts) from a word list.
 * Trie → minimised DAWG (equivalent subtrees shared via signature hashing) → edge array.
 * Deterministic: the same set of words always yields identical bytes.
 */
import { DAWG_HEADER_BYTES, DAWG_MAGIC, DAWG_VERSION, letterIndex } from '../../src/dict/dawg';

interface TrieNode {
  end: boolean;
  children: Map<number, TrieNode>;
  id?: number;
}

const newNode = (): TrieNode => ({ end: false, children: new Map() });

export function buildDawg(words: Iterable<string>): Uint8Array {
  const root = newNode();
  let wordCount = 0;
  const seen = new Set<string>();
  for (const w of words) {
    if (w.length === 0 || seen.has(w)) continue;
    let node = root;
    for (const ch of w) {
      const li = letterIndex(ch);
      if (li === undefined) throw new Error(`Non-Turkish letter in "${w}"`);
      let next = node.children.get(li);
      if (next === undefined) {
        next = newNode();
        node.children.set(li, next);
      }
      node = next;
    }
    node.end = true;
    seen.add(w);
    wordCount++;
  }

  // Minimise: canonical id per distinct (end, children) structure, bottom-up.
  const registry = new Map<string, number>();
  const unique: TrieNode[] = [];
  const canon = (node: TrieNode): number => {
    const parts: string[] = [];
    for (const li of [...node.children.keys()].sort((a, b) => a - b)) {
      const child = node.children.get(li) as TrieNode;
      parts.push(`${li}:${child.end ? 1 : 0}:${canon(child)}`);
    }
    const sig = parts.join(',');
    let id = registry.get(sig);
    if (id === undefined) {
      id = unique.length;
      registry.set(sig, id);
      unique.push(node);
    }
    node.id = id;
    return id;
  };
  canon(root);

  // Lay out: root first, then other non-empty nodes in breadth-first order (deterministic).
  const offset = new Map<number, number>();
  const order: TrieNode[] = [];
  const queue: TrieNode[] = [root];
  let edgeCount = 0;
  while (queue.length > 0) {
    const node = queue.shift() as TrieNode;
    const id = node.id as number;
    if (offset.has(id) || node.children.size === 0) continue;
    offset.set(id, edgeCount);
    edgeCount += node.children.size;
    order.push(node);
    for (const li of [...node.children.keys()].sort((a, b) => a - b)) {
      queue.push(node.children.get(li) as TrieNode);
    }
  }
  if (edgeCount >= 2 ** 25) throw new Error('Dictionary too large for EKDW v1');

  const edges = new Uint32Array(edgeCount);
  let i = 0;
  for (const node of order) {
    const keys = [...node.children.keys()].sort((a, b) => a - b);
    keys.forEach((li, k) => {
      const child = node.children.get(li) as TrieNode;
      const childOffset =
        child.children.size === 0 ? 0 : (offset.get(child.id as number) as number);
      const e =
        li |
        ((k === keys.length - 1 ? 1 : 0) << 5) |
        ((child.end ? 1 : 0) << 6) |
        (childOffset << 7);
      edges[i++] = e >>> 0;
    });
  }

  const out = new Uint8Array(DAWG_HEADER_BYTES + edgeCount * 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, DAWG_MAGIC, true);
  view.setUint32(4, DAWG_VERSION, true);
  view.setUint32(8, edgeCount, true);
  view.setUint32(12, wordCount, true);
  for (let j = 0; j < edgeCount; j++)
    view.setUint32(DAWG_HEADER_BYTES + j * 4, edges[j] as number, true);
  return out;
}
