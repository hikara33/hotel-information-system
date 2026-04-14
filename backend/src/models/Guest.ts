export class Guest {
  constructor(
    public passportNumber: string,
    private readonly fullName: string,
    private readonly birthYear: number,
    private readonly address: string,
    private readonly purpose: string,
  ) {
    this.validatePasssport(passportNumber);
    this.validateBirthYear(birthYear);
  }

  private validatePasssport(passport: string) {
    const regex = /^\d{4}-\d{6}$/;
    
    if (!regex.test(passport)) {
      throw new Error("Неверный формат паспорта. Ожидается NNNN-NNNNNN")
    }
  }

  private validateBirthYear(year: number) {
    const currentYear = new Date().getFullYear();

    if (year < 1900 || year > currentYear) {
      throw new Error("Неверный год рождения");
    }
  }
}