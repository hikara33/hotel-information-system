export type RoomType = "Л" | "П" | "О" | "М";

export class Room {
  public guests: string[] = [];

  constructor(
    public roomNumber: string,
    public type: RoomType,
    public capacity: number,
    public roomsCount: number,
    public hasBathroom: boolean,
    public equipment: string,
  ) {
    this.validateRoomNumber(roomNumber);
  }

  private validateRoomNumber(number: string) {
    const regex = /^(Л|П|О|М)\d{3}$/;

    if (!regex.test(number)) {
      throw new Error("Неверный формат номера комнаты. Ожидается ANNN");
    }
  }

  public get occupied(): number {
    return this.guests.length;
  }

  public isFull(): boolean {
    return this.guests.length >= this.capacity;
  }

  public addGuest(passport: string) {
    if (this.isFull()) {
      throw new Error("Свободных мест в номере нет");
    }

    if (this.guests.includes(passport)) {
      throw new Error("Гость уже заселен в этот номер");
    }

    this.guests.push(passport);
  }

  public removeGuest(passport: string) {
    this.guests = this.guests.filter(p => p !== passport);
  }
}