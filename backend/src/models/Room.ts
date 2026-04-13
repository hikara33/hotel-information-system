export type RoomType = "Л" | "П" | "О" | "М";

export class Room {
  public guests: string[] = [];

  constructor(
    public roomNumber: string,
    public type: RoomType,
    public seats: number,
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
    if (this.guests.length >= this.seats) {
      throw new Error("Свободных мест в номере нет");
    }

    this.guests.push(passport);
  }

  public removeGuest(passport: string) {
    this.guests.filter(p => p !== passport);
  }
}