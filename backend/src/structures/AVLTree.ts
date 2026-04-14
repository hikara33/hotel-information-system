export class AVLNode<T> {
  value: T;
  left: AVLNode<T> | null = null;
  right: AVLNode<T> | null = null;
  height: number = 1;

  constructor(value: T) {
    this.value = value;
  }
}

export class AVLTree<T extends { roomNumber: string, equipment: string }> {
  private root: AVLNode<T> | null = null;

  private getHeight(node: AVLNode<T> | null): number {
    return node ? node.height : 0;
  }

  private getBalance(node: AVLNode<T> | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private rotateRight(y: AVLNode<T>): AVLNode<T> {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;

    return x;
  }

  private rotateLeft(x: AVLNode<T>): AVLNode<T> {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
    y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;

    return y;
  }

  private insertNode(node: AVLNode<T> | null, value: T): AVLNode<T> {
    if (!node) return new AVLNode(value);

    if (value.roomNumber < node.value.roomNumber) {
      node.left = this.insertNode(node.left, value);
    } else if (value.roomNumber > node.value.roomNumber) {
      node.right = this.insertNode(node.right, value);
    } else {
      throw new Error("Duplicate room");
    }

    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));

    const balance = this.getBalance(node);

    // LL
    if (balance > 1 && value.roomNumber < node.left!.value.roomNumber) {
      return this.rotateRight(node);
    }

    // RR
    if (balance < -1 && value.roomNumber > node.right!.value.roomNumber) {
      return this.rotateLeft(node);
    }

    // LR
    if (balance > 1 && value.roomNumber > node.left!.value.roomNumber) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }

    // RL
    if (balance < -1 && value.roomNumber < node.right!.value.roomNumber) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  private preOrderTraversal(node: AVLNode<T> | null, result: T[]): void {
    if (!node) return;

    result.push(node.value);
    this.preOrderTraversal(node.left, result);
    this.preOrderTraversal(node.right, result);
  }

  private findNode(node: AVLNode<T> | null, roomNumber: string): T | null {
    if (!node) return null;

    if (roomNumber === node.value.roomNumber) {
      return node.value;
    }

    if (roomNumber < node.value.roomNumber) {
      return this.findNode(node.left, roomNumber);
    }

    return this.findNode(node.right, roomNumber);
  }

  private deleteNode(node: AVLNode<T> | null, roomNumber: string): AVLNode<T> | null {
    if (!node) return null;

    if (roomNumber < node.value.roomNumber) {
      node.left = this.deleteNode(node.left, roomNumber);
    } else if (roomNumber > node.value.roomNumber) {
      node.right = this.deleteNode(node.right, roomNumber);
    } else {
      if (!node.left || !node.right) {
        return node.left || node.right;
      }
      // 2 ребенка
      const minNode = this.getMin(node.right);
      node.value = minNode.value;
      node.right = this.deleteNode(node.right, minNode.value.roomNumber);
    }

    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    const balance = this.getBalance(node);

    // LL
    if (balance > 1 && this.getBalance(node.left) >= 0) {
      return this.rotateRight(node);
    }

    // LR
    if (balance > 1 && this.getBalance(node.left) < 0) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }

    // RR
    if (balance < -1 && this.getBalance(node.right) <= 0) {
      return this.rotateLeft(node);
    }

    // RL
    if (balance < -1 && this.getBalance(node.right) > 0) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  private getMin(node: AVLNode<T>): AVLNode<T> {
    let current = node;

    while (current.left) {
      current = current.left;
    }

    return current;
  }

  public insert(value: T): void {
    this.root = this.insertNode(this.root, value);
  }

  public find(roomNumber: string): T | null {
    return this.findNode(this.root, roomNumber);
  }

  public preOrder(): T[] {
    const result: T[] = [];
    this.preOrderTraversal(this.root, result);
    return result;
  }

  public delete(roomNumber: string): void {
    this.root = this.deleteNode(this.root, roomNumber);
  }

  public findByEquipment(fragment: string): T[] {
    const result: T[] = [];
    this.searchByEquipment(this.root, fragment.toLowerCase(), result);
    return result;
  }

  private searchByEquipment(node: AVLNode<T> | null, fragment: string, result: T[]): void {
    if (!node) return;

    if (node.value.equipment.toLowerCase().includes(fragment)) {
      result.push(node.value);
    }

    this.searchByEquipment(node.left, fragment, result);
    this.searchByEquipment(node.right, fragment, result);
  }

  public getAll(): T[] {
    return this.preOrder();
  }
}