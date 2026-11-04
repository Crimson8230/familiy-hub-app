// Match Kotlin Char.isWhitespace(): Unicode space categories plus Java control whitespace.
const space = /[\p{Zs}\p{Zl}\p{Zp}\u0009-\u000d\u001c-\u001f]/u;
export function trimChildName(value: string): string {
  let first = 0, last = value.length;
  while (first < last && space.test(value[first])) first++;
  while (last > first && space.test(value[last - 1])) last--;
  return value.slice(first, last);
}
export function childIdentity(value: string): string {
  return trimChildName(value).normalize('NFC').toLowerCase().normalize('NFC');
}
export function isBlank(value: string): boolean { return trimChildName(value).length === 0; }
