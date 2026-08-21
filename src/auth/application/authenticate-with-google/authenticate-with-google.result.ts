import { User } from '../../../users/domain/entities/user.entity';

export interface AuthenticateWithGoogleResult {
  accessToken: string;
  user: User;
}
