import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { loadUserDetail, parseDetailRequest } from '../supabase/functions/admin-overview/userDetail';

const userId = '00000000-0000-4000-8000-000000000001';
const profile = { id: userId, role: 'rider', manager_id: null, name: 'Prueba', country_code: 'ES' };
const calls: Array<{ client: string; table: string; filters: Array<[string, unknown]>; range?: number[]; columns?: string }> = [];
const client = (name: string, rows: Record<string, unknown>[] = []) => ({
  auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: { created_at: '2026-09-30', email_confirmed_at: null } }, error: null })) } },
  from: (table: string) => {
    const call = { client: name, table, filters: [] as Array<[string, unknown]>, range: undefined as number[] | undefined, columns: undefined as string | undefined };
    calls.push(call);
    const query: any = {
      select: (columns: string) => { call.columns = columns; return query; },
      eq: (field: string, value: unknown) => { call.filters.push([field, value]); return query; },
      or: (value: string) => { call.filters.push(['or', value]); return query; },
      order: () => query,
      range: (start: number, end: number) => { call.range = [start, end]; return query; },
      maybeSingle: async () => ({ data: profile, error: null }),
      then: (resolve: any, reject: any) => Promise.resolve({ data: rows, count: 26, error: null }).then(resolve, reject)
    };
    return query;
  }
});

const createHandler = (role: string | null) => {
  let handler: (req: Request) => Promise<Response>;
  const detail = vi.fn(async (_admin: unknown, _caller: unknown, _request: unknown) => ({ user: profile, rows: [] }));
  const privilegedRead = vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: role ? { role } : null, error: null }) }) }) }));
  const userClient = { auth: { getUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null })) } };
  const admin = { from: privilegedRead };
  const source = readFileSync('supabase/functions/admin-overview/index.ts', 'utf8').replace(/^import .*;\n/gm, '');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  vm.runInNewContext(js, {
    Deno: { env: { get: (key: string) => ({ SUPABASE_URL: 'https://test.invalid', SUPABASE_ANON_KEY: 'public-test', SUPABASE_SERVICE_ROLE_KEY: 'server-test' } as Record<string, string>)[key] }, serve: (value: typeof handler) => { handler = value; } },
    createClient: (_url: string, key: string) => key === 'public-test' ? userClient : admin,
    parseDetailRequest, loadUserDetail: detail, Response
  });
  return { handler: handler!, detail, privilegedRead };
};
const request = (body: unknown, authorized = true) => new Request('https://test.invalid', { method: 'POST', headers: { ...(authorized ? { Authorization: 'Bearer test-token' } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('user detail executable security boundary', () => {
  it('rejects anonymous callers before privileged profile reads', async () => {
    const api = createHandler('admin');
    expect((await api.handler(request({ action: 'user-detail', userId }, false))).status).toBe(401);
    expect(api.privilegedRead).not.toHaveBeenCalled();
    expect(api.detail).not.toHaveBeenCalled();
  });
  it.each(['rider', 'manager', null])('rejects current role %s before target data', async role => {
    const api = createHandler(role);
    expect((await api.handler(request({ action: 'user-detail', userId }))).status).toBe(403);
    expect(api.detail).not.toHaveBeenCalled();
  });
  it.each([{ userId: 'x,role.eq.admin' }, { userId, section: 'secrets' }, { userId, page: -1 }, { userId, page: 1.5 }, { userId, page: 2001 }])('rejects malformed detail input %j', async body => {
    const api = createHandler('admin');
    expect((await api.handler(request({ action: 'user-detail', ...body }))).status).toBe(400);
    expect(api.detail).not.toHaveBeenCalled();
  });
  it('calls the bounded reader only after admin authorization', async () => {
    const api = createHandler('admin');
    expect((await api.handler(request({ action: 'user-detail', userId, section: 'incomes', page: 1 }))).status).toBe(200);
    expect(api.detail.mock.calls[0][2]).toEqual({ userId, section: 'incomes', page: 1 });
  });
  it('returns 404 when the selected account no longer exists', async () => {
    const api = createHandler('admin'); api.detail.mockResolvedValueOnce(null as any);
    expect((await api.handler(request({ action: 'user-detail', userId }))).status).toBe(404);
  });
  it.each(['incomes', 'expenses', 'documents', 'declarations'] as const)('scopes %s to the selected user with bounded pagination', async section => {
    calls.length = 0;
    await loadUserDetail(client('admin'), client('caller'), { userId, section, page: 1 });
    const query = calls.find(call => call.table === (section === 'declarations' ? 'tax_declarations' : section));
    expect(query?.filters).toContainEqual(['user_id', userId]);
    expect(query?.range).toEqual([25, 49]);
  });
  it('keeps messages on the participant-only caller client', async () => {
    calls.length = 0;
    await loadUserDetail(client('admin'), client('caller'), { userId, section: 'messages', page: 0 });
    const query = calls.find(call => call.table === 'messages');
    expect(query?.client).toBe('caller');
    expect(query?.filters).toContainEqual(['or', `sender_id.eq.${userId},recipient_id.eq.${userId}`]);
  });
  it('does not return private document paths or file contents', async () => {
    const detail = await loadUserDetail(client('admin', [{ id: 'doc', content: `${userId}/private.pdf`, name: 'Justificante' }]), client('caller'), { userId, section: 'documents', page: 0 });
    expect(detail?.rows).toEqual([{ id: 'doc', name: 'Justificante', hasFile: true }]);
    expect(JSON.stringify(detail?.rows)).not.toContain('private.pdf');
  });
});
