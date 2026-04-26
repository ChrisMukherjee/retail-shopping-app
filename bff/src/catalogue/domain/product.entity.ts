export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public price: number,
    public category: string,
    public stockTotal: number,
    public stockReserved: number = 0,
  ) {}

  get stockAvailable(): number {
    return this.stockTotal - this.stockReserved;
  }
}
