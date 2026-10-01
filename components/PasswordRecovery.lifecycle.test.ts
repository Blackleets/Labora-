import { describe, expect, it, vi } from 'vitest';
import { createHookHarness, elementText, findElement } from '../services/testHookHarness';

const icons = new Proxy({}, { has: () => true, get: (_, key) => String(key) });
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const button = (tree: any, text: string) => findElement(tree, node => node.type === 'button' && elementText(node).includes(text));
const form = (tree: any) => findElement(tree, node => node.type === 'form');
const input = (tree: any, id: string) => findElement(tree, node => node.props?.id === id);
const formSetup = (mode: 'request' | 'update') => {
  const request = vi.fn().mockResolvedValue(undefined); const update = vi.fn().mockResolvedValue(undefined); const back = vi.fn();
  const hooks = createHookHarness('components/PasswordRecoveryForm.tsx', { 'lucide-react': icons, '../services/passwordRecovery': { requestPasswordRecovery: request, updateRecoveredPassword: update } });
  const render = () => hooks.render({ mode, onBack: back });
  return { hooks, render, request, update, back };
};

describe('recovery form handlers', () => {
  it('shows a generic confirmation only after the request resolves and blocks a second request', async () => {
    const s = formSetup('request'); let finish!: () => void;
    s.request.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    input(s.render(), 'recovery-email').props.onChange({ target: { value: 'qa@example.test' } });
    const pending = form(s.render()).props.onSubmit({ preventDefault() {} });
    expect(elementText(s.render())).toContain('Solicitando'); expect(elementText(s.render())).not.toContain('Si el correo');
    await form(s.render()).props.onSubmit({ preventDefault() {} }); expect(s.request).toHaveBeenCalledTimes(1);
    finish(); await pending;
    expect(elementText(s.render())).toContain('Si el correo está registrado');
  });
  it('a provider failure keeps the email available for retry', async () => {
    const s = formSetup('request'); s.request.mockRejectedValueOnce(new Error('Espera unos minutos.'));
    input(s.render(), 'recovery-email').props.onChange({ target: { value: 'qa@example.test' } });
    await form(s.render()).props.onSubmit({ preventDefault() {} });
    expect(input(s.render(), 'recovery-email').props.value).toBe('qa@example.test'); expect(elementText(s.render())).toContain('Espera');
    await form(s.render()).props.onSubmit({ preventDefault() {} }); expect(s.request).toHaveBeenCalledTimes(2);
  });
  it('a failed update preserves the new values and never displays success', async () => {
    const s = formSetup('update'); s.update.mockRejectedValueOnce(new Error('Contraseña rechazada.'));
    input(s.render(), 'recovery-password').props.onChange({ target: { value: 'qa-password-only' } });
    input(s.render(), 'recovery-confirmation').props.onChange({ target: { value: 'qa-password-only' } });
    await form(s.render()).props.onSubmit({ preventDefault() {} });
    expect(input(s.render(), 'recovery-password').props.value).toBe('qa-password-only'); expect(elementText(s.render())).not.toContain('Contraseña actualizada.');
    await form(s.render()).props.onSubmit({ preventDefault() {} });
    expect(form(s.render())).toBeUndefined(); expect(elementText(s.render())).toContain('Contraseña actualizada.');
  });
  it('late completion cannot resurrect a form after unmount', async () => {
    const s = formSetup('request'); let finish!: () => void;
    s.request.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const pending = form(s.render()).props.onSubmit({ preventDefault() {} }); s.hooks.unmount(); finish(); await pending;
    expect(elementText(s.render())).not.toContain('Si el correo');
  });
});

describe('recovery workspace gate', () => {
  const setup = (entry: unknown) => {
    let accept!: () => void; let reject!: () => void;
    const init = vi.fn(() => new Promise<void>((a, b) => { accept = a; reject = () => b(new Error('invalid')); }));
    const exit = vi.fn().mockResolvedValue(undefined); const reload = vi.fn();
    const hooks = createHookHarness('components/PasswordRecoveryGate.tsx', {
      'lucide-react': icons, '../services/passwordRecoveryRoute': { recoveryEntry: entry },
      '../services/passwordRecovery': { initializePasswordRecovery: init, exitPasswordRecovery: exit },
      './Logo': { default: 'Logo' }, './PasswordRecoveryForm': { default: 'RecoveryForm' }
    }, { window: { location: { reload } } });
    const render = () => hooks.render({ children: 'PRIVATE_WORKSPACE' });
    return { render, accept: () => accept(), reject: () => reject(), init, exit, reload };
  };
  it('ordinary entry renders the workspace without initializing recovery', () => {
    const s = setup(null); expect(elementText(s.render())).toContain('PRIVATE_WORKSPACE'); expect(s.init).not.toHaveBeenCalled();
  });
  it('recovery never renders the workspace before or after verification', async () => {
    const s = setup({ kind: 'link' }); expect(elementText(s.render())).not.toContain('PRIVATE_WORKSPACE');
    s.accept(); await flush();
    const node = findElement(s.render(), node => node.type === 'RecoveryForm');
    expect(node.props.mode).toBe('update'); expect(elementText(s.render())).not.toContain('PRIVATE_WORKSPACE');
  });
  it('an invalid link offers another request without exposing an existing workspace', async () => {
    const s = setup({ kind: 'invalid' }); s.render(); s.reject(); await flush();
    expect(elementText(s.render())).toContain('Necesitas un nuevo enlace'); expect(elementText(s.render())).not.toContain('PRIVATE_WORKSPACE');
    button(s.render(), 'Solicitar otro').props.onClick();
    expect(findElement(s.render(), node => node.type === 'RecoveryForm').props.mode).toBe('request');
  });
  it('a sign-out error holds the gate and provides retry instead of reloading', async () => {
    const s = setup({ kind: 'invalid' }); s.render(); s.reject(); await flush();
    s.exit.mockRejectedValueOnce(new Error('network')); button(s.render(), 'Volver').props.onClick(); await flush();
    expect(s.reload).not.toHaveBeenCalled(); expect(elementText(s.render())).toContain('reintenta');
    button(s.render(), 'Volver').props.onClick(); await flush(); expect(s.reload).toHaveBeenCalledTimes(1);
  });
});
