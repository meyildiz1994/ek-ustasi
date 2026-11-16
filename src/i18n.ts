import tr from '../i18n/tr.json';

type Dict = { [key: string]: string | Dict };

/**
 * Minimal i18n lookup. All player-visible strings live in i18n/tr.json.
 * `t('home.play')` → "Oyna"; `t('morph.order', { prev: 'hâl', next: 'yapım' })` interpolates
 * `{name}` placeholders. Missing keys return the key itself so they are easy to spot.
 */
export function t(key: string, params?: Readonly<Record<string, string | number>>): string {
  let node: string | Dict | undefined = tr as Dict;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string') return key;
    node = node[part];
  }
  if (typeof node !== 'string') return key;
  if (params === undefined) return node;
  return node.replace(/\{(\w+)\}/g, (m, name: string) =>
    params[name] === undefined ? m : String(params[name]),
  );
}
