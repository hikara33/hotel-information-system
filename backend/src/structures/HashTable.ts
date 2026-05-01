type Bucket<T> = T[];

export class HashTable<T extends { passportNumber: string }> {
  private table: Bucket<T>[];
  private size: number;
  private count: number = 0;

  constructor(size: number = 50) {
    this.size = size;
    this.table = new Array(size).fill(null).map(() => []);
  }

  public homeIndex(passportNumber: string): number {
    const digits = passportNumber.replace(/\D/g, "");
    let hash = 0;
    const base = 31;

    for (let i = 0; i < digits.length; i++) {
      hash = hash * base + Number(digits[i]);
    }

    return hash % this.size;
  }

  private loadFactor(): number {
    return this.count / this.size;
  }

  private getChain(index: number): Bucket<T> {
    return this.table[index]!;
  }

  private getNextPrime(n: number): number {
    const isPrime = (num: number): boolean => {
      if (num < 2) return false;
      for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) return false;
      }
      return true;
    };

    while (!isPrime(n)) {
      n++;
    }

    return n;
  }

  private resize(): void {
    const oldTable = this.table;

    this.size = this.getNextPrime(this.size * 2);
    this.table = new Array(this.size).fill(null).map(() => []);

    this.count = 0;

    for (const chain of oldTable) {
      for (const value of chain) {
        this.insert(value);
      }
    }
  }

  public insert(value: T): void {
    if (this.loadFactor() >= 0.7) {
      this.resize();
    }

    const index = this.homeIndex(value.passportNumber);
    const chain = this.getChain(index);
    const duplicate = chain.some((item) => item.passportNumber === value.passportNumber);

    if (duplicate) {
      throw new Error("Duplicate passportNumber");
    }

    chain.push(value);
    this.count++;
  }

  public find(passportNumber: string): T | null {
    const index = this.homeIndex(passportNumber);
    const chain = this.getChain(index);
    return chain.find((item) => item.passportNumber === passportNumber) ?? null;
  }

  public delete(passportNumber: string): boolean {
    const index = this.homeIndex(passportNumber);
    const chain = this.getChain(index);
    const elementIndex = chain.findIndex((item) => item.passportNumber === passportNumber);

    if (elementIndex === -1) {
      return false;
    }

    chain.splice(elementIndex, 1);
    this.count--;
    return true;
  }

  public values(): T[] {
    const result: T[] = [];

    for (const chain of this.table) {
      result.push(...chain);
    }

    return result;
  }

  public getStructureView(): {
    size: number;
    count: number;
    loadFactor: number;
    buckets: Array<{
      index: number;
      state: "EMPTY" | "FILLED";
      chainLength: number;
      passport?: string;
      homeIndex?: number;
      passports?: string[];
      entries?: Array<{
        passport: string;
        homeIndex: number;
      }>;
    }>;
  } {
    const buckets = this.table.map((chain, index) => {
      if (chain.length > 0) {
        const entries = chain.map((item) => {
          const passport = item.passportNumber;
          return {
            passport,
            homeIndex: this.homeIndex(passport)
          };
        });
        const firstEntry = entries[0]!;
        return {
          index,
          state: "FILLED" as const,
          chainLength: chain.length,
          passport: firstEntry.passport,
          homeIndex: firstEntry.homeIndex,
          passports: entries.map((entry) => entry.passport),
          entries
        };
      }
      return { index, state: "EMPTY" as const, chainLength: 0 };
    });

    return {
      size: this.size,
      count: this.count,
      loadFactor: this.count / this.size,
      buckets
    };
  }
}