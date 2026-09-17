import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('debe estar definido e instanciarse correctamente', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });
});
