import { beforeEach, describe, expect, it, vi } from 'vitest';
const invoke = vi.hoisted(() => vi.fn());
const from = vi.hoisted(() => vi.fn());
const createSignedUrl = vi.hoisted(() => vi.fn());
vi.mock('./supabaseClient', () => ({ SUPABASE_URL: 'https://test.supabase.co', supabase: { functions: { invoke }, from, storage: { from: () => ({ createSignedUrl }) } } }));
import { loadAdminDocumentUrl, loadAdminUserDetail } from './adminUserDetail';
const userId = '00000000-0000-4000-8000-000000000001';
beforeEach(() => { vi.clearAllMocks(); });
describe('admin detail response and private file boundary', () => {
  it.each([{ user: { id: 'another' } }, { section: 'expenses' }, { page: 1 }, { total: -1 }])('rejects a mismatched response %j', async override => {
    invoke.mockResolvedValue({ data: { user: { id: userId }, section: 'incomes', page: 0, rows: [], total: 0, ...override }, error: null });
    await expect(loadAdminUserDetail(userId, 'incomes', 0)).rejects.toThrow('no corresponde');
  });
  it('does not convert a server failure to an empty successful ficha', async () => {
    invoke.mockResolvedValue({ data: { error: 'Forbidden' }, error: null });
    await expect(loadAdminUserDetail(userId, 'profile', 0)).rejects.toThrow('No se pudo');
  });
  it('does not sign a file denied by document RLS', async () => {
    from.mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) });
    await expect(loadAdminDocumentUrl(userId, 'doc')).rejects.toThrow('no tiene acceso');
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
  it('rejects paths belonging to another owner', async () => {
    from.mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { content: 'another/private.pdf' }, error: null }) }) }) }) });
    await expect(loadAdminDocumentUrl(userId, 'doc')).rejects.toThrow('revisión de acceso');
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
  it('uses a short-lived signed URL only after caller document and Storage access', async () => {
    from.mockReturnValue({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { content: `${userId}/doc.pdf` }, error: null }) }) }) }) });
    createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://test.supabase.co/storage/v1/object/sign/doc' }, error: null });
    await expect(loadAdminDocumentUrl(userId, 'doc')).resolves.toContain('/storage/v1/');
    expect(createSignedUrl).toHaveBeenCalledWith(`${userId}/doc.pdf`, 60);
  });
});
