export type RoomType = "Л" | "П" | "О" | "М";

export class Room {
  public occupied: number = 0;
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
      throw new Error("Неверный формат номера комнаты. Ожидается ANNN")
    }
  }

  public addGuest(passport: string) {
    if (this.occupied >= this.capacity) {
      throw new Error("Свободных мест в номере нет");
    }

    this.guests.push(passport);
    this.occupied++;
  }

  public removeGuest(passport: string) {
    const index = this.guests.indexOf(passport);
    
    if (index !== -1) {
      this.guests.splice(index, 1);
      this.occupied--;
    }

    if (this.occupied < 0) this.occupied = 0;
  }
}