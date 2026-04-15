import type { Guest } from "../models/Guest.js";
import type { Room } from "../models/Room.js";

export type GuestDto = {
  passportNumber: string;
  fullName: string;
  birthYear: number;
  address: string;
  purpose: string;
};

export type RoomDto = {
  roomNumber: string;
  type: string;
  capacity: number;
  roomsCount: number;
  hasBathroom: boolean;
  equipment: string;
  occupied: number;
  guests: string[];
};

export function toGuestDto(guest: Guest): GuestDto {
  return {
    passportNumber: guest.passportNumber,
    fullName: guest.getFullName(),
    birthYear: guest.getBirthYear(),
    address: guest.getAddress(),
    purpose: guest.getPurpose()
  };
}

export function toRoomDto(room: Room): RoomDto {
  return {
    roomNumber: room.roomNumber,
    type: room.type,
    capacity: room.capacity,
    roomsCount: room.roomsCount,
    hasBathroom: room.hasBathroom,
    equipment: room.equipment,
    occupied: room.occupied,
    guests: room.guests
  };
}
