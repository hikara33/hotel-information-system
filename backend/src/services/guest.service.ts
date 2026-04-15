import type { Guest } from "../models/Guest.js";
import { containsByBoyerMoore } from "../algorithms/boyer-moore.js";
import { radixSortStrings } from "../algorithms/distribution-sort.js";
import { HashTable } from "../structures/HashTable.js";

export class GuestService {
  private guests: HashTable<Guest>;

  constructor() {
    this.guests = new HashTable<Guest>(50);
  }

  public registerGuest(guest: Guest): void {
    this.guests.insert(guest);
  }

  public deleteGuest(passport: string): boolean {
    return this.guests.delete(passport);
  }

  public findByPassport(passport: string): Guest | null {
    return this.guests.find(passport);
  }

  public findByName(name: string): Guest[] {
    if (!name.trim()) {
      return [];
    }
    const result: Guest[] = [];
    for (const guest of this.guests.values()) {
      if (containsByBoyerMoore(guest.getFullName(), name)) {
        result.push(guest);
      }
    }
    return result;
  }

  public findAllGuests(): Guest[] {
    const guests = this.guests.values();
    const sortedKeys = radixSortStrings(guests.map((g) => g.passportNumber));
    const guestMap = new Map(guests.map((g) => [g.passportNumber, g]));
    return sortedKeys.map((key) => guestMap.get(key)!).filter(Boolean);
  }

  public clear(): void {
    this.guests = new HashTable<Guest>(50);
  }

  public getHashTableStructure() {
    return this.guests.getStructureView();
  }
}