import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('responde status "ok" con un timestamp ISO', () => {
    const controller = new HealthController();

    const response = controller.check();

    expect(response.status).toBe('ok');
    expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
  });
});
