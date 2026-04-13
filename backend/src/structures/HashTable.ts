export enum BucketState {
  EMPTY,
  FILLED,
  DELETED
}

type Bucket<T> = {
  state: BucketState;
  value: T | null;
};

export class HashTable<T extends { passportNumber: string }> {
  private table: Bucket<T>[];
  private size: number;
  private count: number = 0;

  constructor(size: number = 50) {
    this.size = size;
    this.table = new Array(size).fill(null).map(() => ({
      state: BucketState.EMPTY,
      value: null
    }));
  }

  private hash(key: string): number {
    const digits = key.replace(/\D/g, "");
    let sum = 0;

    for (let i = 0; i < digits.length; i++) {
      sum += digits.charCodeAt(i);
    }

    return sum % this.size;
  }

  public insert(value: T): void {
    let index = this.hash(value.passportNumber);

    for (let i = 0; i < this.size; i++) {
      const tryIndex = (index + i) % this.size;
      const bucket = this.table[tryIndex];

      if (
        bucket?.state === BucketState.FILLED &&
        bucket.value?.passportNumber === value.passportNumber
      ) {
        throw new Error("Duplicate passportNumber");
      }

      if (
        bucket?.state === BucketState.EMPTY ||
        bucket?.state === BucketState.DELETED
      ) {
        this.table[tryIndex] = {
          state: BucketState.FILLED,
          value
        };

        this.count++;
        return;
      }
    }

    throw new Error("Хэш-таблица переполнена");
  }

  public find(passportNumber: string): T | null {
    let index = this.hash(passportNumber);

    for (let i = 0; i < this.size; i++) {
      const tryIndex = (index + i) % this.size;
      const bucket = this.table[tryIndex];
    
      if (bucket?.state === BucketState.EMPTY) return null;

      if (
        bucket?.state === BucketState.FILLED &&
        bucket.value?.passportNumber === passportNumber
      ) {
        return bucket.value;
      }
    }

    return null;
  }

  public delete(passportNumber: string): boolean {
    let index = this.hash(passportNumber);

    for (let i = 0; i < this.size; i++) {
      const tryIndex = (index + i) % this.size;
      const bucket = this.table[tryIndex];

      if (bucket?.state === BucketState.EMPTY) return false;

      if (
        bucket?.state === BucketState.FILLED &&
        bucket.value?.passportNumber === passportNumber
      ) {
        this.table[tryIndex] = {
          state: BucketState.DELETED,
          value: null
        };

        this.count--;
        return true;
      }
    }

    return false;
  }
}