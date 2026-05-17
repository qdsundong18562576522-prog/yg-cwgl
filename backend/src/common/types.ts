export type UserRole = 'admin' | 'finance' | 'leader' | 'viewer';

export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
}

export interface RequestWithUser {
  user: {
    userId: number;
    username: string;
    role: UserRole;
  };
}
