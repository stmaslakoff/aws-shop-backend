export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface JoinedProduct extends Product {
  count: number;
}
