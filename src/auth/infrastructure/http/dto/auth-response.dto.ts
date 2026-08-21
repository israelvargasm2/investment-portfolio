import { AuthenticateWithGoogleResult } from '../../../application/authenticate-with-google/authenticate-with-google.result';

export class AuthenticatedUserDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export class AuthResponseDto {
  accessToken: string;
  user: AuthenticatedUserDto;

  static fromResult(result: AuthenticateWithGoogleResult): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = result.accessToken;
    dto.user = {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      avatarUrl: result.user.avatarUrl,
    };
    return dto;
  }
}
