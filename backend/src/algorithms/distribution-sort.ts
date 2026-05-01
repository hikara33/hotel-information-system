export function radixSortStrings(values: string[]): string[] {
  if (values.length === 0) return [];
  const maxLen = values.reduce((max, current) => Math.max(max, current.length), 0);
  let result = [...values];

  const ALPHABET_SIZE = 256;

  for (let pos = maxLen - 1; pos >= 0; pos--) {
    const buckets: string[][] = Array.from(
      { length: ALPHABET_SIZE },
      () => []
    );

    for (const value of result) {
      const code = pos < value.length ? value.charCodeAt(pos) : 0;
      buckets[code]?.push(value);
    }

    result = [];
    for (let i = 0; i < ALPHABET_SIZE; i++) {
      if (buckets[i]!.length > 0) {
        result.push(...buckets[i]!);
      }
    }
  }

  return result;
}
