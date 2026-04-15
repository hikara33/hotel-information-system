import { Room } from "../models/Room.js";
import { AVLTree } from "../structures/AVLTree.js";

export class RoomService {
  private rooms: AVLTree<Room>;

  constructor() {
    this.rooms = new AVLTree<Room>();
  }

  public addRoom(room: Room): void {
    this.rooms.insert(room);
  }

  public deleteRoom(roomNumber: string): void {
    this.rooms.delete(roomNumber);
  }

  public findRoom(roomNumber: string): Room | null {
    return this.rooms.find(roomNumber);
  }

  public getAllRooms(): Room[] {
    return this.rooms.getAll();
  }

  public findByEquipment(fragment: string): Room[] {
    if (!fragment.trim()) {
      return [];
    }
    return this.rooms.findByEquipment(fragment);
  }

  public getTreeView() {
    return this.rooms.toLevelSnapshot();
  }

  public getAvlNestedGraph() {
    return this.rooms.toNestedGraph();
  }

  public clear(): void {
    this.rooms = new AVLTree<Room>();
  }
}