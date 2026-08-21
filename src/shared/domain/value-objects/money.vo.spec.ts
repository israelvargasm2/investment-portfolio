import { Money } from './money.vo';

describe('Money', () => {
  it('crea una instancia normalizando la moneda a mayúsculas', () => {
    const money = Money.of(100.5, 'usd');

    expect(money.amount).toBe(100.5);
    expect(money.currency).toBe('USD');
  });

  it('lanza un error si el monto es negativo', () => {
    expect(() => Money.of(-1, 'USD')).toThrow('Invalid money amount: -1');
  });

  it('lanza un error si el monto no es un número finito', () => {
    expect(() => Money.of(Number.NaN, 'USD')).toThrow(/Invalid money amount/);
  });

  it('lanza un error si el código de moneda no tiene 3 letras', () => {
    expect(() => Money.of(100, 'US')).toThrow('Invalid currency code: US');
  });
});
