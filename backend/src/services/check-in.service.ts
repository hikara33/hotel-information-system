import { CheckIn } from "../models/CheckIn.js";
import { LayeredList } from "../structures/LayeredList.js";
import { assertCheckOutAfterCheckIn } from "../validation.js";
import type { GuestService } from "./guest.service.js";
import type { RoomService } from "./room.service.js";

export class CheckInService {
  private checkIns = new LayeredList<CheckIn>();

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

    const alreadyLiving = this.getActive().some(
      (c) => c.passportNumber === passport
    );

    if (alreadyLiving) {
      throw new Error("Гость уже заселен");
    }

    room.addGuest(passport);

    this.checkIns.insert(roomNumber, new CheckIn(passport, roomNumber, date));
  }

  public checkOut(passport: string, date: string): void {
    const record = this.getAll().find(
      (c) => c.passportNumber === passport && c.checkOutDate === null
    );

    if (!record) {
      throw new Error("Активное заселение не найдено");
    }

    assertCheckOutAfterCheckIn(record.checkInDate, date);

    const room = this.roomService.findRoom(record.roomNumber);
    if (!room) {
      throw new Error("Комната не найдена");
    }

    room.removeGuest(passport);
    record.checkOut(date);
  }

  public getAll(): CheckIn[] {
    return this.checkIns.values();
  }

  public getActive(): CheckIn[] {
    return this.getAll().filter((c) => c.checkOutDate === null);
  }

  public findByPassport(passport: string): CheckIn[] {
    return this.getAll().filter((c) => c.passportNumber === passport);
  }

  public findByRoom(roomNumber: string): CheckIn[] {
    return this.checkIns.findByKey(roomNumber);
  }

  public hasActiveStayByPassport(passport: string): boolean {
    return this.getActive().some((record) => record.passportNumber === passport);
  }

  public hasActiveStayByRoom(roomNumber: string): boolean {
    return this.getActive().some((record) => record.roomNumber === roomNumber);
  }

  public clear(): void {
    this.checkIns = new LayeredList<CheckIn>();
  }

  public deleteCheckInRecord(passport: string, roomNumber: string, checkInDate: string): boolean {
    const atKey = this.checkIns.findByKey(roomNumber);
    const record = atKey.find(
      (c) =>
        c.passportNumber === passport &&
        c.checkInDate === checkInDate
    );
    if (!record) {
      return false;
    }

    if (record.checkOutDate === null) {
      const room = this.roomService.findRoom(roomNumber);
      if (room) {
        room.removeGuest(passport);
      }
    }

    return this.checkIns.removeByPredicate(roomNumber, (c) => this.sameCheckIn(c, record));
  }

  public removeAllCheckInsForRoom(roomNumber: string): void {
    const snapshot = [...this.checkIns.findByKey(roomNumber)];
    for (const record of snapshot) {
      this.checkIns.removeByPredicate(roomNumber, (c) => this.sameCheckIn(c, record));
    }
  }

  public removeAllCheckInsForPassport(passport: string): void {
    const snapshot = this.getAll().filter((c) => c.passportNumber === passport);
    for (const record of snapshot) {
      this.checkIns.removeByPredicate(record.roomNumber, (c) => this.sameCheckIn(c, record));
    }
  }

  private sameCheckIn(a: CheckIn, b: CheckIn): boolean {
    return (
      a.passportNumber === b.passportNumber &&
      a.roomNumber === b.roomNumber &&
      a.checkInDate === b.checkInDate &&
      a.checkOutDate === b.checkOutDate
    );
  }

  //визуализация слоеного списка
  public getLayeredListStructure() {
    return this.checkIns.getStructureView((c) => {
      const state = c.checkOutDate === null ? "активно" : `выселен ${c.checkOutDate}`;
      return `${c.passportNumber} · ${c.roomNumber} · заселение ${c.checkInDate} · ${state}`;
    });
  }
}