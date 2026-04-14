import { CheckIn } from "../models/CheckIn.js";
import type { GuestService } from "./guest.service.js";
import type { RoomService } from "./room.service.js";

export class CheckInService {
  private checkIns: CheckIn[] = [];

  constructor(
    private guestService: GuestService,
    private roomService: RoomService
  ) {}

  public checkIn(passport: string, roomNumber: string, date: string): void {
    const guest = this.guestService.findByPassport(passport);
    if (!guest) {
      throw new Error("Гость не найден");
    }

    const room = this.roomService.findRoom(roomNumber);
    if (!room) {
      throw new Error("Комната не найдена");
    }

    const alreadyLiving = this.checkIns.some(
      c => c.passportNumber === passport && c.checkOutDate === null
    );

    if (alreadyLiving) {
      throw new Error("Гость уже заселен");
    }

    room.addGuest(passport);

    this.checkIns.push(
      new CheckIn(passport, roomNumber, date)
    );
  }

  public checkOut(passport: string, date: string): void {
    const record = this.checkIns.find(
      c => c.passportNumber === passport && c.checkOutDate === null
    );

    if (!record) {
      throw new Error("Активное заселение не найдено");
    }

    const room = this.roomService.findRoom(record.roomNumber);
    if (!room) {
      throw new Error("Комната не найдена");
    }

    room.removeGuest(passport);
    record.checkOut(date);
  }

  public getAll(): CheckIn[] {
    return this.checkIns;
  }

  public getActive(): CheckIn[] {
    return this.checkIns.filter(c => c.checkOutDate === null);
  }

  public findByPassport(passport: string): CheckIn[] {
    return this.checkIns.filter(c => c.passportNumber === passport);
  }

  public findByRoom(roomNumber: string): CheckIn[] {
    return this.checkIns.filter(c => c.roomNumber === roomNumber);
  }
}