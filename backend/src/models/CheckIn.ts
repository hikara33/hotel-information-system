export class CheckIn {
  constructor(
    public passportNumber: string,
    public roomNumber: string,
    public checkInDate: string,
    public checkOutDate: string | null = null,
  ) {}

  public isActive(): boolean {
    return this.checkOutDate === null;
  }

  public checkOut(date: string) {
    this.checkOutDate = date;
  }
}