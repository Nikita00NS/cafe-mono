export type CategoryId =
  | 'breakfast'
  | 'japanese'
  | 'italian'
  | 'european'
  | 'sets'
  | 'coffee'
  | 'desserts';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryId;
  weight?: string;
  tags?: string[];
  image?: string;
  badge?: string;
};

export type LunchOption = {
  id: string;
  title: string;
  composition: string[];
  price: number;
  note?: string;
};

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'cooking'
  | 'ready'
  | 'delivering'
  | 'done'
  | 'cancelled';

export type OrderType = 'delivery' | 'pickup';
export type PaymentMethod = 'cash' | 'card' | 'online';

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  number: string;
  createdAt: number;
  updatedAt: number;
  status: OrderStatus;
  type: OrderType;
  customer: {
    name: string;
    phone: string;
    address?: string;
    comment?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: PaymentMethod;
  prepMinutes: number;
  acceptedAt?: number;
  etaAt?: number;
  preorder?: boolean;
  completedAt?: number;
  statusLog: { at: number; status: OrderStatus }[];
};

export type Settings = {
  acceptingOrders: boolean;
  openHour: number;
  closeHour: number;
  prepPickup: number;
  prepDelivery: number;
  deliveryFee: number;
  freeDeliveryFrom: number;
  minOrder: number;
  stopList: string[];
};

export const DEFAULT_SETTINGS: Settings = {
  acceptingOrders: true,
  openHour: 9,
  closeHour: 21,
  prepPickup: 20,
  prepDelivery: 45,
  deliveryFee: 150,
  freeDeliveryFrom: 1000,
  minOrder: 500,
  stopList: [],
};

export const PUBLIC_SETTING_KEYS: (keyof Settings)[] = [
  'acceptingOrders',
  'openHour',
  'closeHour',
  'prepPickup',
  'prepDelivery',
  'deliveryFee',
  'freeDeliveryFrom',
  'minOrder',
  'stopList',
];
