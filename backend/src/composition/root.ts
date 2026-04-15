import { CheckInService } from "../services/check-in.service.js";
import { GuestService } from "../services/guest.service.js";
import { HotelApplicationService } from "../services/hotel-application.service.js";
import { RoomService } from "../services/room.service.js";

export function createHotelContainer(): {
  guestService: GuestService;
  roomService: RoomService;
  checkInService: CheckInService;
  application: HotelApplicationService;
} {
  const guestService = new GuestService();
  const roomService = new RoomService();
  const checkInService = new CheckInService(guestService, roomService);
  const application = new HotelApplicationService(guestService, roomService, checkInService);
  return { guestService, roomService, checkInService, application };
}
