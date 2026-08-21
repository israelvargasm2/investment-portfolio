import { User } from '../../../../users/domain/entities/user.entity';

export class UserProfileResponseDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  createdAt: string;

  static fromDomain(user: User): UserProfileResponseDto {
    const dto = new UserProfileResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.fullName = user.fullName;
    dto.avatarUrl = user.avatarUrl;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
