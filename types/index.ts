export type CartItem = {
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  variantLabel: string | null;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
};
