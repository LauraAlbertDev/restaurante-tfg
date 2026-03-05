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
  created_at?: string;
}


export type PhilosophyUpdate = Omit<Philosophy, 'id'>;
export type CommentUpdate = Partial<Omit<Comment, 'id'>>;

export interface ApiResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

export interface CommentUpdateResponse extends ApiResponse {
  archived_status: boolean;
}
