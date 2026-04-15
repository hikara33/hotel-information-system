class SkipNode<T> {
  public forwards: Array<SkipNode<T> | null>;

  constructor(public key: string, public values: T[], level: number) {
    this.forwards = new Array(level).fill(null);
  }
}

export class LayeredList<T> {
  private readonly maxLevel: number;
  private readonly probability: number;
  private level = 1;
  private readonly head: SkipNode<T>;

  constructor(maxLevel = 8, probability = 0.5) {
    this.maxLevel = maxLevel;
    this.probability = probability;
    this.head = new SkipNode<T>("", [], this.maxLevel);
  }

  public insert(key: string, value: T): void {
    const update = new Array<SkipNode<T>>(this.maxLevel).fill(this.head);
    let current = this.head;

    for (let i = this.level - 1; i >= 0; i--) {
      while (current.forwards[i] && current.forwards[i]!.key < key) {
        current = current.forwards[i]!;
      }
      update[i] = current;
    }

    current = current.forwards[0] ?? this.head;

    if (current !== this.head && current.key === key) {
      current.values.push(value);
      return;
    }

    const nodeLevel = this.randomLevel();
    if (nodeLevel > this.level) {
      for (let i = this.level; i < nodeLevel; i++) {
        update[i] = this.head;
      }
      this.level = nodeLevel;
    }

    const newNode = new SkipNode<T>(key, [value], nodeLevel);
    for (let i = 0; i < nodeLevel; i++) {
      newNode.forwards[i] = update[i]!.forwards[i] ?? null;
      update[i]!.forwards[i] = newNode;
    }
  }

  public values(): T[] {
    const result: T[] = [];
    let current = this.head.forwards[0];

    while (current) {
      result.push(...current.values);
      current = current.forwards[0];
    }

    return result;
  }

  public findByKey(key: string): T[] {
    let current = this.head;

    for (let i = this.level - 1; i >= 0; i--) {
      while (current.forwards[i] && current.forwards[i]!.key < key) {
        current = current.forwards[i]!;
      }
    }

    current = current.forwards[0] ?? this.head;
    if (current !== this.head && current.key === key) {
      return [...current.values];
    }

    return [];
  }

  public removeByPredicate(key: string, predicate: (value: T) => boolean): boolean {
    let current = this.head;

    for (let i = this.level - 1; i >= 0; i--) {
      while (current.forwards[i] && current.forwards[i]!.key < key) {
        current = current.forwards[i]!;
      }
    }

    const node = current.forwards[0];
    if (!node || node.key !== key) {
      return false;
    }

    const before = node.values.length;
    node.values = node.values.filter((v) => !predicate(v));

    if (node.values.length === before) {
      return false;
    }

    if (node.values.length === 0) {
      this.unlinkNode(node.key);
    }

    return true;
  }

  private unlinkNode(key: string): void {
    const update = new Array<SkipNode<T>>(this.maxLevel).fill(this.head);
    let current = this.head;

    for (let i = this.level - 1; i >= 0; i--) {
      while (current.forwards[i] && current.forwards[i]!.key < key) {
        current = current.forwards[i]!;
      }
      update[i] = current;
    }

    const target = current.forwards[0];
    if (!target || target.key !== key) {
      return;
    }

    for (let i = 0; i < this.level; i++) {
      if (update[i]!.forwards[i] !== target) {
        break;
      }
      update[i]!.forwards[i] = target.forwards[i] ?? null;
    }

    while (this.level > 1 && this.head.forwards[this.level - 1] === null) {
      this.level--;
    }
  }

  private randomLevel(): number {
    let lvl = 1;
    while (Math.random() < this.probability && lvl < this.maxLevel) {
      lvl++;
    }
    return lvl;
  }

  /**
   * Снимок слоеного списка: узлы упорядочены по ключу (номер комнаты),
   * для каждого уровня — ключ следующего узла в «этаже» или null.
   */
  public getStructureView(valueLabel: (value: T) => string): {
    maxLevels: number;
    activeHeight: number;
    headNextKeys: (string | null)[];
    nodes: Array<{
      key: string;
      towerHeight: number;
      labels: string[];
      nextKeys: (string | null)[];
    }>;
  } {
    const headNextKeys = this.head.forwards.map((forward) =>
      forward ? (forward.key === "" ? "—" : forward.key) : null
    );

    const nodes: Array<{
      key: string;
      towerHeight: number;
      labels: string[];
      nextKeys: (string | null)[];
    }> = [];

    let current = this.head.forwards[0];
    while (current) {
      const nextKeys = current.forwards.map((forward) =>
        forward ? (forward.key === "" ? "—" : forward.key) : null
      );
      nodes.push({
        key: current.key,
        towerHeight: current.forwards.length,
        labels: current.values.map(valueLabel),
        nextKeys
      });
      current = current.forwards[0];
    }

    return {
      maxLevels: this.maxLevel,
      activeHeight: this.level,
      headNextKeys,
      nodes
    };
  }
}
