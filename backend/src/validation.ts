const PASSPORT_RE = /^\d{4}-\d{6}$/;
const ROOM_RE = /^(Л|П|О|М)\d{3}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const LIMITS = {
  fullNameMin: 2,
  fullNameMax: 120,
  addressMin: 2,
  addressMax: 200,
  purposeMin: 2,
  purposeMax: 200,
  equipmentMin: 1,
  equipmentMax: 400,
  capacityMin: 1,
  capacityMax: 50,
  roomsCountMin: 1,
  roomsCountMax: 30
};

function parseIsoDate(value: string): Date {
  if (!ISO_DATE_RE.test(value)) {
    throw new Error("Дата должна быть в формате ГГГГ-ММ-ДД");
  }
  const d = new Date(value + "T12:00:00");
  if (Number.isNaN(d.getTime())) {
    throw new Error("Некорректная дата");
  }
  return d;
}

export function assertPassport(value: unknown, label = "Номер паспорта"): string {
  const s = String(value ?? "").trim();
  if (!PASSPORT_RE.test(s)) {
    throw new Error(`${label}: ожидается формат NNNN-NNNNNN`);
  }
  return s;
}

export function assertRoomNumber(value: unknown, label = "Номер комнаты"): string {
  const s = String(value ?? "").trim();
  if (!ROOM_RE.test(s)) {
    throw new Error(`${label}: ожидается ANNN (Л/П/О/М + три цифры)`);
  }
  return s;
}

export function assertIsoDate(value: unknown, fieldName: string): string {
  const s = String(value ?? "").trim();
  parseIsoDate(s);
  return s;
}

export function validateGuestCreate(body: unknown): {
  passportNumber: string;
  fullName: string;
  birthYear: number;
  address: string;
  purpose: string;
} {
  if (!body || typeof body !== "object") {
    throw new Error("Некорректное тело запроса");
  }
  const b = body as Record<string, unknown>;
  const passportNumber = assertPassport(b.passportNumber);
  const fullName = String(b.fullName ?? "").trim();
  if (fullName.length < LIMITS.fullNameMin || fullName.length > LIMITS.fullNameMax) {
    throw new Error(`ФИО: от ${LIMITS.fullNameMin} до ${LIMITS.fullNameMax} символов`);
  }
  const birthYear = Number(b.birthYear);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > currentYear) {
    throw new Error(`Год рождения: целое число от 1900 до ${currentYear}`);
  }
  const address = String(b.address ?? "").trim();
  if (address.length < LIMITS.addressMin || address.length > LIMITS.addressMax) {
    throw new Error(`Адрес: от ${LIMITS.addressMin} до ${LIMITS.addressMax} символов`);
  }
  const purpose = String(b.purpose ?? "").trim();
  if (purpose.length < LIMITS.purposeMin || purpose.length > LIMITS.purposeMax) {
    throw new Error(`Цель прибытия: от ${LIMITS.purposeMin} до ${LIMITS.purposeMax} символов`);
  }
  return { passportNumber, fullName, birthYear, address, purpose };
}

export function validateRoomCreate(body: unknown): {
  roomNumber: string;
  capacity: number;
  roomsCount: number;
  hasBathroom: boolean;
  equipment: string;
} {
  if (!body || typeof body !== "object") {
    throw new Error("Некорректное тело запроса");
  }
  const b = body as Record<string, unknown>;
  const roomNumber = assertRoomNumber(b.roomNumber);
  const capacity = Number(b.capacity);
  if (!Number.isInteger(capacity) || capacity < LIMITS.capacityMin || capacity > LIMITS.capacityMax) {
    throw new Error(`Количество мест: целое от ${LIMITS.capacityMin} до ${LIMITS.capacityMax}`);
  }
  const roomsCount = Number(b.roomsCount);
  if (!Number.isInteger(roomsCount) || roomsCount < LIMITS.roomsCountMin || roomsCount > LIMITS.roomsCountMax) {
    throw new Error(`Количество комнат: целое от ${LIMITS.roomsCountMin} до ${LIMITS.roomsCountMax}`);
  }
  const equipment = String(b.equipment ?? "").trim();
  if (equipment.length < LIMITS.equipmentMin || equipment.length > LIMITS.equipmentMax) {
    throw new Error(`Оборудование: от ${LIMITS.equipmentMin} до ${LIMITS.equipmentMax} символов`);
  }
  const hasBathroom = Boolean(b.hasBathroom);
  return { roomNumber, capacity, roomsCount, hasBathroom, equipment };
}

export function validateCheckInCreate(body: unknown): {
  passportNumber: string;
  roomNumber: string;
  checkInDate: string;
} {
  if (!body || typeof body !== "object") {
    throw new Error("Некорректное тело запроса");
  }
  const b = body as Record<string, unknown>;
  return {
    passportNumber: assertPassport(b.passportNumber, "Паспорт"),
    roomNumber: assertRoomNumber(b.roomNumber, "Номер комнаты"),
    checkInDate: assertIsoDate(b.checkInDate, "Дата заселения")
  };
}

export function validateCheckOutCreate(body: unknown): {
  passportNumber: string;
  checkOutDate: string;
} {
  if (!body || typeof body !== "object") {
    throw new Error("Некорректное тело запроса");
  }
  const b = body as Record<string, unknown>;
  return {
    passportNumber: assertPassport(b.passportNumber, "Паспорт"),
    checkOutDate: assertIsoDate(b.checkOutDate, "Дата выселения")
  };
}

export function assertCheckOutAfterCheckIn(checkInDate: string, checkOutDate: string): void {
  const a = parseIsoDate(checkInDate);
  const b = parseIsoDate(checkOutDate);
  if (b < a) {
    throw new Error("Дата выселения не может быть раньше даты заселения");
  }
}

export function validateCheckInDelete(body: unknown): {
  passportNumber: string;
  roomNumber: string;
  checkInDate: string;
} {
  return validateCheckInCreate(body);
}
