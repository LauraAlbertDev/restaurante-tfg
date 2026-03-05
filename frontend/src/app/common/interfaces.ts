export interface Philosophy {
  id: number;
  icon: string;
  title: string;
  message: string;
}

export interface UserComment {
  id?: number;
  name: string;
  tel: string;
  email: string;
  message: string;
  note?: string;
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
