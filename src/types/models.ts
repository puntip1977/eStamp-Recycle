export type Role = 'employee' | 'admin';

export interface Branch {
  id: string;
  name: string;
}

export interface Profile {
  id: string;
  nickname: string;
  phone: string;
  branch_id: string | null;
  role: Role;
}

export interface ItemType {
  id: string;
  name: string;
  points_per_unit: number;
  icon: string | null;
  active: boolean;
}

export interface TransactionItemResult {
  item_type_id: string;
  name: string;
  count: number;
  points: number;
}

export interface TransactionResult {
  id: string;
  total_points: number;
  created_at: string;
  photo_path: string | null;
  items: TransactionItemResult[];
}

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  top_n: number;
  status: 'active' | 'closed';
}
