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

