import { CheckIn } from "../models/CheckIn.js";
import type { Guest } from "../models/Guest.js";
import { HashTable } from "../structures/HashTable.js";

export class GuestService {
  private guests: HashTable<Guest>;
  private checkIns: CheckIn[] = [];

  constructor() {
    this.guests = new HashTable<Guest>(50);
  }

  public registerGuest(guest: Guest): void {
    this.guests.insert(guest);
  }

  public deleteGuest(passport: string): boolean {
    const isLiving = this.checkIns.some(
      c => c.passportNumber === passport && c.checkOutDate === null
    );
    
    if (isLiving) {
      throw new Error("Нельзя удалить заселенного пользователя");
    }

    return this.guests.delete(passport);
  }

  public findByPassport(passport: string): Guest | null {
    return this.guests.find(passport);
  }

  public findByName(name: string): Guest[] {
    const result: Guest[] = [];
    //в будущем алгоритм бойер-мура
    return result;
  }

  public checkIn(passport: string, room: string, date: string): void {
    const guest = this.guests.find(passport);
    if (!guest) {
      throw new Error("Гость не найден");
    }

    const isCheckedIn = this.checkIns.some(
      c => c.passportNumber === passport && c.checkOutDate === null
    );
    if (isCheckedIn) throw new Error("Гость уже засилен");

    const newCheckIn = new CheckIn(passport, room, date);
    this.checkIns.push(newCheckIn);
  }

  public checkOut(passport: string, date: string): void {
    const record = this.checkIns.find(
      c => c.passportNumber === passport && c.checkOutDate === null
    );

    if (!record) {
      throw new Error("Активная регистрация не найдена");
    }
    record.checkOut(date);
  }

  public findAllGuests(): Guest[] {
    return this.guests.values();
  }
}