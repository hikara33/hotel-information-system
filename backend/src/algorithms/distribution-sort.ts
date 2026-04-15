export function radixSortStrings(values: string[]): string[] {
  const maxLen = values.reduce((max, current) => Math.max(max, current.length), 0);
  let result = [...values];

  for (let pos = maxLen - 1; pos >= 0; pos--) {
    const buckets = new Map<number, string[]>();

    for (const value of result) {
      const charCode = value.charCodeAt(pos) || 0;
      const bucket = buckets.get(charCode) ?? [];
      bucket.push(value);
      buckets.set(charCode, bucket);
    }

    const sortedCodes = Array.from(buckets.keys()).sort((a, b) => a - b);
    result = sortedCodes.flatMap((code) => buckets.get(code) ?? []);
  }

  return result;
}
