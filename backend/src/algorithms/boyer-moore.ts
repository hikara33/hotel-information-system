export function containsByBoyerMoore(text: string, pattern: string): boolean {
  if (pattern.length === 0) return true;
  if (pattern.length > text.length) return false;

  const source = text.toLowerCase();
  const target = pattern.toLowerCase();
  const badCharShift = buildBadCharTable(target);

  let shift = 0;

  while (shift <= source.length - target.length) {
    let j = target.length - 1;

    while (j >= 0 && target[j] === source[shift + j]) {
      j--;
    }

    if (j < 0) {
      return true;
    }

    const mismatchChar = source.charAt(shift + j);
    const fallback = badCharShift.get(mismatchChar) ?? -1;
    shift += Math.max(1, j - fallback);
  }

  return false;
}

function buildBadCharTable(pattern: string): Map<string, number> {
  const table = new Map<string, number>();

  for (let i = 0; i < pattern.length; i++) {
    table.set(pattern.charAt(i), i);
  }

  return table;
}
