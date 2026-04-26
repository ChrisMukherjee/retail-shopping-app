import { Product } from '../../domain/product.entity';

export const PRODUCTS_SEED: Product[] = [
  new Product('prod_001', 'Sony WH-1000XM5 Headphones', 'Industry-leading noise cancellation with up to 30-hour battery life.', 299.99, 'Electronics', 15),
  new Product('prod_002', 'Kindle Paperwhite (16GB)', 'Waterproof e-reader with a 6.8" glare-free display and weeks of battery.', 149.99, 'Electronics', 8),
  new Product('prod_003', 'Nike Air Max 270 (UK 10)', 'Iconic Air Max cushioning with a large heel unit for all-day comfort.', 124.99, 'Footwear', 20),
  new Product('prod_004', 'LEGO Technic Porsche 911', '1,458-piece detailed replica of the iconic Porsche 911 GT3 RS.', 89.99, 'Toys', 5),
  new Product('prod_005', 'Dyson V12 Detect Slim', 'Laser dust detection vacuum with up to 60 minutes of fade-free power.', 549.99, 'Home', 3),
  new Product('prod_006', 'Nespresso Vertuo Pop Machine', 'One-touch coffee machine compatible with all Vertuo capsules.', 79.99, 'Home', 12),
  new Product('prod_007', 'Fitbit Charge 6', 'Advanced fitness tracker with built-in GPS and Google apps support.', 119.99, 'Electronics', 10),
];
