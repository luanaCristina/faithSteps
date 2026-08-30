import { hashPassword, verifyPassword } from '@/modules/passwords';

describe('passwords', () => {
  it('gera hashes diferentes e valida a senha original', async () => {
    const first = await hashPassword('uma-senha-segura');
    const second = await hashPassword('uma-senha-segura');

    expect(first).not.toBe(second);
    expect(first.startsWith('scrypt$')).toBe(true);
    await expect(verifyPassword('uma-senha-segura', first)).resolves.toBe(true);
    await expect(verifyPassword('senha-incorreta', first)).resolves.toBe(false);
  });

  it('rejeita hash ausente ou malformado', async () => {
    await expect(verifyPassword('qualquer', null)).resolves.toBe(false);
    await expect(verifyPassword('qualquer', 'nao-e-um-hash')).resolves.toBe(false);
  });
});
