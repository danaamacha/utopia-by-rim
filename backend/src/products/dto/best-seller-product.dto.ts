export class BestSellerProductDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  sku: string | null;
  stockQuantity: number;
  isActive: boolean;
  soldQuantity: number; // aggregated from order_items
  primaryImage: {
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
  } | null;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}



