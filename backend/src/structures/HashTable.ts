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
}