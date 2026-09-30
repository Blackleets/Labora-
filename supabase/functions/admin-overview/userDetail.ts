// Called only after admin-overview verifies the caller's current server-side role.
export const DETAIL_SECTIONS = ['profile', 'incomes', 'expenses', 'documents', 'requirements', 'declarations', 'messages', 'clients'] as const;
export type DetailSection = typeof DETAIL_SECTIONS[number];
export const DETAIL_PAGE_SIZE = 25;

export const parseDetailRequest = (body: Record<string, unknown>) => {
  if (typeof body.userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.userId)) throw new Error('Invalid user ID');
  const section = body.section ?? 'profile';
  const page = body.page ?? 0;
  if (!DETAIL_SECTIONS.includes(section as DetailSection)) throw new Error('Invalid section');
  if (typeof page !== 'number' || !Number.isInteger(page) || page < 0 || page > 2000) throw new Error('Invalid page');
  return { userId: body.userId, section: section as DetailSection, page };
};

export const loadUserDetail = async (admin: any, userClient: any, request: ReturnType<typeof parseDetailRequest>) => {
  const { userId, section, page } = request;
  const profile = await admin.from('profiles').select('id,name,email,role,country_code,manager_id,phone,nif,company_name,collegiate_number,fiscal_regime,iae_code,social_security_type,platforms,work_modes,workplaces,created_at,updated_at').eq('id', userId).maybeSingle();
  if (profile.error) throw new Error('Unable to load user profile');
  if (!profile.data) return null;
  const auth = await admin.auth.admin.getUserById(userId);
  if (auth.error) throw new Error('Unable to load account status');
  const manager = profile.data.manager_id
    ? await admin.from('profiles').select('id,name,email,role').eq('id', profile.data.manager_id).maybeSingle()
    : { data: null, error: null };
  if (manager.error) throw new Error('Unable to load linked manager');
  let result: any = { data: [], count: 0, error: null };
  const from = page * DETAIL_PAGE_SIZE;
  const to = from + DETAIL_PAGE_SIZE - 1;
  if (section === 'incomes') result = await admin.from('incomes').select('id,platform,date,amount,retention,source_type,needs_review,reviewed_at', { count: 'exact' }).eq('user_id', userId).order('date', { ascending: false }).order('id').range(from, to);
  if (section === 'expenses') result = await admin.from('expenses').select('id,category,merchant,date,amount,status,deductible_percentage,vat_amount', { count: 'exact' }).eq('user_id', userId).order('date', { ascending: false }).order('id').range(from, to);
  if (section === 'documents') result = await admin.from('documents').select('id,name,type,document_date,mime_type,size_bytes,content', { count: 'exact' }).eq('user_id', userId).order('document_date', { ascending: false }).order('id').range(from, to);
  if (section === 'requirements') result = await admin.from('requirements').select('id,title,description,status,deadline,quarter,created_at,submission_notes,review_note', { count: 'exact' }).eq(profile.data.role === 'rider' ? 'rider_id' : 'manager_id', userId).order('created_at', { ascending: false }).order('id').range(from, to);
  if (section === 'declarations') result = await admin.from('tax_declarations').select('id,title,quarter,year,model_type,status,tax_amount,filing_reference,filed_at', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).order('id').range(from, to);
  // Message contents retain the existing participant-only RLS, even for admins.
  if (section === 'messages') result = await userClient.from('messages').select('id,message,status,created_at,sender_id,recipient_id', { count: 'exact' }).or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: false }).order('id').range(from, to);
  if (section === 'clients') result = await admin.from('profiles').select('id,name,email,role,country_code').eq('manager_id', userId).eq('role', 'rider').order('name').order('id').range(from, to);
  if (section === 'clients') {
    // Count uses the identical relationship scope; no directory-size inference.
    const count = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('manager_id', userId).eq('role', 'rider');
    if (count.error) throw new Error('Unable to count linked clients');
    result.count = count.count;
  }
  if (result.error) throw new Error('Unable to load user records');
  const rows = (result.data || []).map((row: any) => {
    if (section !== 'documents') return row;
    const { content, ...metadata } = row;
    return { ...metadata, hasFile: Boolean(content) };
  });
  return {
    generatedAt: new Date().toISOString(),
    user: { ...profile.data, created_at: auth.data?.user?.created_at || profile.data.created_at, last_sign_in_at: auth.data?.user?.last_sign_in_at || null, email_confirmed: Boolean(auth.data?.user?.email_confirmed_at) },
    manager: manager.data,
    section, page, pageSize: DETAIL_PAGE_SIZE, total: result.count ?? rows.length, rows
  };
};
