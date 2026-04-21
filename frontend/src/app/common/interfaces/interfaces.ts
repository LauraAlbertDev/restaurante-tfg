export interface Philosophy {
  id: number;
  icon: string;
  title: string;
  message: string;
}

export interface UserComment {
  id: number;
  name: string;
  tel: string;
  email: string;
  message: string;
  note?: string;
  archived: boolean;
}
export type UpdateCommentDTO = Omit<UserComment, 'id'>;


export type PhilosophyUpdate = Omit<Philosophy, 'id'>;

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

export interface CommentUpdateResponse extends ApiResponse {
  archived_status: boolean;
}

export interface User{
  id:number;
  name: string;
  email: string;
  password: string;
  type: string;
  active: boolean;
  created_at: Date;
}

export interface Category {
  id: number;
  name: string;
}

export interface Allergen {
  id: number;
  name: string;
  color: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category_id: number;
  category_name?: string;
  vegan: number;
  vegetarian: number;
  lactose_free: number;
  archived: number;
  allergens: Allergen[];
}

export const STATUS_CONFIG = {
  unconfirmed: { label: 'Pendiente', color: 'text-bg-warning', icon: 'bi-clock' },
  confirmed: { label: 'Confirmada', color: 'text-bg-success', icon: 'bi-patch-check-fill' },
  cancelled: { label: 'Cancelada', color: 'text-bg-danger', icon: 'bi-x-circle-fill' }
} as const;

export type ReservationStatus = keyof typeof STATUS_CONFIG;

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  unconfirmed: STATUS_CONFIG.unconfirmed.label,
  confirmed: STATUS_CONFIG.confirmed.label,
  cancelled: STATUS_CONFIG.cancelled.label
};

export interface Reservation {
  id: number;
  name: string;
  phone: string;
  date: string;
  hour: string;
  rices?: string;
  n_people: number;
  notes: string;
  status: ReservationStatus;
  created_by?: number;
  creator_name?: string;
  updated_at: Date;
  updated_by?: number;
  editor_name?: string;
}


export type ReservationCreateDTO = Omit<Reservation, 'id' | 'updated_at' | 'creator_name' | 'editor_name'>;

export interface DayRule{
  day_of_week: number;
  day_name: string;
  max_capacity: number;
  is_open: boolean;
}

export interface Shift{
  id: number;
  start_time: string;
  active: boolean;
}


