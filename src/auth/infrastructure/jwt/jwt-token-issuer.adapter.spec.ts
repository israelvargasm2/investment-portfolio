import { JwtService } from '@nestjs/jwt';
import { JwtTokenIssuerAdapter } from './jwt-token-issuer.adapter';

describe('JwtTokenIssuerAdapter', () => {
  it('delega la firma del token en JwtService con el payload recibido', async () => {
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    };
    const adapter = new JwtTokenIssuerAdapter(
      jwtService as unknown as JwtService,
    );

    const token = await adapter.issueAccessToken({
      sub: 'user-1',
      email: 'ada@example.com',
    });

    expect(token).toBe('signed.jwt.token');
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'ada@example.com',
    });
  });
});
