import type { IncomingMessage, ServerResponse } from "node:http";
import { isBusinessRuleError } from "../errors/business-rule.error.js";
import { readJsonBody, sendJson } from "./json.js";
import type { HotelApplicationService } from "../services/hotel-application.service.js";
import {
  assertPassport,
  assertRoomNumber,
  validateCheckInCreate,
  validateCheckInDelete,
  validateCheckOutCreate,
  validateGuestCreate,
  validateRoomCreate
} from "../validation.js";

export type StaticFileSender = (
  res: ServerResponse,
  fileName: string,
  contentType: string
) => Promise<void>;

export async function dispatchHotelRequest(
  req: IncomingMessage,
  res: ServerResponse,
  app: HotelApplicationService,
  serveStatic: StaticFileSender
): Promise<void> {
  if (!req.url) {
    sendJson(res, 400, { error: "Empty URL" });
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const method = req.method ?? "GET";

  if (url.pathname === "/" || url.pathname === "/index.html") {
    await serveStatic(res, "index.html", "text/html; charset=utf-8");
    return;
  }
  if (url.pathname === "/app.js") {
    await serveStatic(res, "app.js", "application/javascript; charset=utf-8");
    return;
  }
  if (url.pathname === "/styles.css") {
    await serveStatic(res, "styles.css", "text/css; charset=utf-8");
    return;
  }

  try {
    if (url.pathname === "/api/guests" && method === "GET") {
      sendJson(res, 200, app.listGuests());
      return;
    }

    if (url.pathname === "/api/guests" && method === "POST") {
      const body = await readJsonBody(req);
      const v = validateGuestCreate(body);
      sendJson(res, 201, app.registerGuest(v));
      return;
    }

    if (url.pathname === "/api/guests/search" && method === "GET") {
      const name = url.searchParams.get("name") ?? "";
      sendJson(res, 200, app.searchGuestsByName(name));
      return;
    }

    if (url.pathname.startsWith("/api/guests/") && method === "GET") {
      const passport = assertPassport(decodeURIComponent(url.pathname.replace("/api/guests/", "")));
      const data = app.getGuestWithActiveRoom(passport);
      if (!data) {
        sendJson(res, 404, { error: "Гость не найден" });
        return;
      }
      sendJson(res, 200, { ...data.guest, roomNumber: data.roomNumber });
      return;
    }

    if (url.pathname.startsWith("/api/guests/") && method === "DELETE") {
      const passport = assertPassport(decodeURIComponent(url.pathname.replace("/api/guests/", "")));
      const deleted = app.deleteGuest(passport);
      sendJson(res, deleted ? 200 : 404, { deleted });
      return;
    }

    if (url.pathname === "/api/rooms" && method === "GET") {
      sendJson(res, 200, app.listRooms());
      return;
    }

    if (url.pathname === "/api/rooms" && method === "POST") {
      const body = await readJsonBody(req);
      const v = validateRoomCreate(body);
      sendJson(res, 201, app.addRoom(v));
      return;
    }

    if (url.pathname === "/api/rooms/search-equipment" && method === "GET") {
      const fragment = url.searchParams.get("fragment") ?? "";
      sendJson(res, 200, app.searchRoomsByEquipment(fragment));
      return;
    }

    if (url.pathname.startsWith("/api/rooms/") && method === "GET") {
      const roomNumber = assertRoomNumber(decodeURIComponent(url.pathname.replace("/api/rooms/", "")));
      const data = app.getRoomWithResidents(roomNumber);
      if (!data) {
        sendJson(res, 404, { error: "Комната не найдена" });
        return;
      }
      sendJson(res, 200, data);
      return;
    }

    if (url.pathname.startsWith("/api/rooms/") && method === "DELETE") {
      const roomNumber = assertRoomNumber(decodeURIComponent(url.pathname.replace("/api/rooms/", "")));
      app.deleteRoom(roomNumber);
      sendJson(res, 200, { deleted: true });
      return;
    }

    if (url.pathname === "/api/checkins" && method === "GET") {
      sendJson(res, 200, app.listCheckIns());
      return;
    }

    if (url.pathname === "/api/checkins" && method === "DELETE") {
      const body = await readJsonBody(req);
      const v = validateCheckInDelete(body);
      const deleted = app.deleteCheckInRecord(v.passportNumber, v.roomNumber, v.checkInDate);
      sendJson(res, deleted ? 200 : 404, { deleted });
      return;
    }

    if (url.pathname === "/api/checkins" && method === "POST") {
      const body = await readJsonBody(req);
      const v = validateCheckInCreate(body);
      app.checkIn(v.passportNumber, v.roomNumber, v.checkInDate);
      sendJson(res, 201, { ok: true });
      return;
    }

    if (url.pathname === "/api/checkouts" && method === "POST") {
      const body = await readJsonBody(req);
      const v = validateCheckOutCreate(body);
      app.checkOut(v.passportNumber, v.checkOutDate);
      sendJson(res, 201, { ok: true });
      return;
    }

    if (url.pathname === "/api/tree" && method === "GET") {
      sendJson(res, 200, app.getTreeView());
      return;
    }

    if (url.pathname === "/api/structures" && method === "GET") {
      sendJson(res, 200, app.getStructuresSnapshot());
      return;
    }

    if (url.pathname === "/api/reset" && method === "POST") {
      app.resetAll();
      sendJson(res, 200, { ok: true });
      return;
    }

    if (url.pathname === "/api/demo-data" && method === "POST") {
      app.loadDemoData();
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { error: "Route not found" });
  } catch (error) {
    if (isBusinessRuleError(error)) {
      sendJson(res, error.httpStatus, { error: error.message });
      return;
    }
    sendJson(res, 400, { error: (error as Error).message });
  }
}
