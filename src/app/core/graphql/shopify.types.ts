export interface Money {
  amount: string;
  currencyCode: string;
}

export interface Image {
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: SelectedOption[];
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface CollectionRef {
  handle: string;
  title: string;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice?: Money;
  };
  compareAtPriceRange: {
    minVariantPrice: Money;
  };
  featuredImage: Image | null;
  images?: { nodes: Image[] };
  variants?: { nodes: ProductVariant[] };
  options?: ProductOption[];
  collections?: { nodes: CollectionRef[] };
  tags: string[];
  seo?: { title: string; description: string };
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: Image | null;
  seo?: { title: string; description: string };
  products?: {
    pageInfo: PageInfo;
    nodes: Product[];
  };
}

export interface CartLineItem {
  id: string;
  quantity: number;
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    price: Money;
    compareAtPrice: Money | null;
    product: {
      title: string;
      handle: string;
      featuredImage: Image | null;
    };
    selectedOptions: SelectedOption[];
  };
}

export interface MailingAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

export interface OrderLineItem {
  title: string;
  quantity: number;
  variant: {
    image?: Image | null;
    price: Money;
  } | null;
}

export interface Order {
  id: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  currentTotalPrice: Money;
  statusUrl: string;
  lineItems: { nodes: OrderLineItem[] };
}

export interface CustomerData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  defaultAddress?: MailingAddress | null;
  addresses: { nodes: MailingAddress[] };
  orders: { nodes: Order[] };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  discountCodes: { code: string; applicable: boolean }[];
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money | null;
  };
  lines: { nodes: CartLineItem[] };
}
