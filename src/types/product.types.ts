export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface StockProduct extends Product {
  count: number;
}

export interface CreateProductData {
  title: string;
  description?: string;
  price: number;
  count?: number;
}
