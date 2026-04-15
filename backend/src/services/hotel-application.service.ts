import { BusinessRuleError } from "../errors/business-rule.error.js";
import { toGuestDto, toRoomDto, type GuestDto, type RoomDto } from "../mappers/guest-room.dto.js";
import { Guest } from "../models/Guest.js";
import { Room, type RoomType } from "../models/Room.js";
import type { CheckInService } from "./check-in.service.js";
import type { GuestService } from "./guest.service.js";
import type { RoomService } from "./room.service.js";

type GuestCreateInput = {
  passportNumber: string;
  fullName: string;
  birthYear: number;
  address: string;
  purpose: string;
};

type RoomCreateInput = {
  roomNumber: string;
  capacity: number;
  roomsCount: number;
  hasBathroom: boolean;
  equipment: string;
};

export class HotelApplicationService {
  constructor(
    private readonly guests: GuestService,
    private readonly rooms: RoomService,
    private readonly stays: CheckInService
  ) {}

  public listGuests(): GuestDto[] {
    return this.guests.findAllGuests().map(toGuestDto);
  }

  public registerGuest(input: GuestCreateInput): GuestDto {
    const guest = new Guest(
      input.passportNumber,
      input.fullName,
      input.birthYear,
      input.address,
      input.purpose
    );
    this.guests.registerGuest(guest);
    return toGuestDto(guest);
  }

  public searchGuestsByName(name: string): GuestDto[] {
    return this.guests.findByName(name).map(toGuestDto);
  }
  
  public getGuestWithActiveRoom(passport: string): {
    guest: GuestDto;
    roomNumber: string | null;
  } | null {
    const guest = this.guests.findByPassport(passport);
    if (!guest) {
      return null;
    }
    const activeStay = this.stays.getActive().find((stay) => stay.passportNumber === passport);
    return {
      guest: toGuestDto(guest),
      roomNumber: activeStay?.roomNumber ?? null
    };
  }

  public deleteGuest(passport: string): boolean {
    if (this.stays.hasActiveStayByPassport(passport)) {
      throw new BusinessRuleError("Нельзя удалить: гость заселен в номер", 409);
    }
    const deleted = this.guests.deleteGuest(passport);
    if (deleted) {
      this.stays.removeAllCheckInsForPassport(passport);
    }
    return deleted;
  }

  public listRooms(): RoomDto[] {
    return this.rooms.getAllRooms().map(toRoomDto);
  }

  public addRoom(input: RoomCreateInput): RoomDto {
    const type = input.roomNumber[0] as RoomType;
    const room = new Room(
      input.roomNumber,
      type,
      input.capacity,
      input.roomsCount,
      input.hasBathroom,
      input.equipment
    );
    this.rooms.addRoom(room);
    return toRoomDto(room);
  }

  public searchRoomsByEquipment(fragment: string): RoomDto[] {
    return this.rooms.findByEquipment(fragment).map(toRoomDto);
  }

  public deleteRoom(roomNumber: string): void {
    if (this.stays.hasActiveStayByRoom(roomNumber)) {
      throw new BusinessRuleError("Нельзя удалить: в номере есть проживающие", 409);
    }
    this.stays.removeAllCheckInsForRoom(roomNumber);
    this.rooms.deleteRoom(roomNumber);
  }

  public listCheckIns() {
    return this.stays.getAll();
  }

  public deleteCheckInRecord(passport: string, roomNumber: string, checkInDate: string): boolean {
    return this.stays.deleteCheckInRecord(passport, roomNumber, checkInDate);
  }

  public checkIn(passport: string, roomNumber: string, date: string): void {
    this.stays.checkIn(passport, roomNumber, date);
  }

  public checkOut(passport: string, date: string): void {
    this.stays.checkOut(passport, date);
  }

  public getTreeView() {
    return this.rooms.getTreeView();
  }

  public getStructuresSnapshot() {
    return {
      hashTable: this.guests.getHashTableStructure(),
      avlTree: this.rooms.getAvlNestedGraph(),
      layeredList: this.stays.getLayeredListStructure()
    };
  }

  public resetAll(): void {
    this.stays.clear();
    this.guests.clear();
    this.rooms.clear();
  }

  public loadDemoData(): void {
    this.resetAll();

    const rooms: RoomCreateInput[] = [
      {
        roomNumber: "Л101",
        capacity: 2,
        roomsCount: 1,
        hasBathroom: true,
        equipment: "Wi-Fi, TV, кондиционер"
      },
      {
        roomNumber: "П202",
        capacity: 3,
        roomsCount: 2,
        hasBathroom: true,
        equipment: "Wi-Fi, холодильник, мини-кухня"
      },
      {
        roomNumber: "О303",
        capacity: 1,
        roomsCount: 1,
        hasBathroom: false,
        equipment: "Вентилятор, рабочий стол"
      }
    ];

    const guests: GuestCreateInput[] = [
      {
        passportNumber: "1111-111111",
        fullName: "Иванов Иван Иванович",
        birthYear: 1995,
        address: "г. Москва, ул. Лесная, 12",
        purpose: "Командировка"
      },
      {
        passportNumber: "0000-000019",
        fullName: "Петров Петр Петрович",
        birthYear: 1992,
        address: "г. Казань, ул. Баумана, 8",
        purpose: "Отпуск"
      },
      {
        passportNumber: "2000-000008",
        fullName: "Сидорова Анна Сергеевна",
        birthYear: 1998,
        address: "г. Самара, ул. Ново-Садовая, 51",
        purpose: "Конференция"
      },
      {
        passportNumber: "1234-567890",
        fullName: "Кузнецов Дмитрий Олегович",
        birthYear: 1989,
        address: "г. Екатеринбург, ул. Мира, 17",
        purpose: "Транзит"
      }
    ];

    for (const room of rooms) {
      this.addRoom(room);
    }
    for (const guest of guests) {
      this.registerGuest(guest);
    }

    this.checkIn("1111-111111", "Л101", "2026-04-10");
    this.checkIn("0000-000019", "Л101", "2026-04-11");
    this.checkIn("1234-567890", "П202", "2026-04-12");
    this.checkOut("1234-567890", "2026-04-14");
  }
}
