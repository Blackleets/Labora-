import { User, UserRole } from '../types';
import { assertManagerSignupFields } from './registrationValidation';
import { supabase } from './supabaseClient';

const LOCAL = {
  users: 'labora_users',
  currentUser: 'labora_user',
  onboarded: 'labora_onboarding',
  country: 'labora_country',
  pendingIdentity: 'labora_pending_identity'
} as const;

type ProfileRow = {
  id: string;
  role: 'rider' | 'manager' | 'admin';
  name: string;
  email: string;
  phone?: string | null;
  nif?: string | null;
  company_name?: string | null;
  collegiate_number?: string | null;
  manager_id?: string | null;
  fiscal_regime?: string | null;
  iae_code?: string | null;
  social_security_type?: string | null;
  vehicle_type?: User['vehicleType'] | null;
  vehicle_plate?: string | null;
  vehicle_fuel?: User['vehicleFuel'] | null;
  country_code?: string | null;
  platforms?: string[] | null;
  banks?: string[] | null;
  onboarding_completed?: boolean | null;
  identity_image_path?: string | null;
  identity_image_kind?: string | null;
};

const roleFromDb = (role: ProfileRow['role']): UserRole => {
  if (role === 'manager') return UserRole.MANAGER;
  if (role === 'admin') return UserRole.ADMIN;
  return UserRole.RIDER;
};

const roleToDb = (role: UserRole) => {
  if (role === UserRole.MANAGER) return 'manager';
  if (role === UserRole.ADMIN) return 'admin';
  return 'rider';
};

const requireAuthenticatedUser = async (expectedUserId?: string) => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Tu sesión ha caducado. Vuelve a iniciar sesión.');

  if (expectedUserId && expectedUserId !== data.user.id) {
    throw new Error('La sesión activa no coincide con el perfil local. Cierra sesión y vuelve a entrar.');
  }

  return data.user;
};

const identityUrl = async (path?: string | null) => {
  if (!path) return undefined;
  const { data, error } = await supabase.storage.from('labora-identity').createSignedUrl(path, 60 * 60);
  return error ? undefined : data.signedUrl;
};

const rowToUser = async (row: ProfileRow): Promise<User> => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone || undefined,
  photoUrl: await identityUrl(row.identity_image_path),
  role: roleFromDb(row.role),
  platforms: Array.isArray(row.platforms) ? row.platforms : [],
  banks: Array.isArray(row.banks) ? row.banks : [],
  managerId: row.manager_id || undefined,
  currencyPreference: 'EUR',
  nif: row.nif || undefined,
  fiscalRegime: row.fiscal_regime || undefined,
  iaeCode: row.iae_code || undefined,
  socialSecurityType: row.social_security_type || undefined,
  vehicleType: row.vehicle_type || undefined,
  vehiclePlate: row.vehicle_plate || undefined,
  vehicleFuel: row.vehicle_fuel || undefined,
  companyName: row.company_name || undefined,
  collegiateNumber: row.collegiate_number || undefined,
  countryCode: row.country_code || 'ES'
});

export const loadRemoteWorkspace = async (currentUserId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,role,name,email,phone,nif,company_name,collegiate_number,manager_id,fiscal_regime,iae_code,social_security_type,vehicle_type,vehicle_plate,vehicle_fuel,country_code,platforms,banks,onboarding_completed,identity_image_path,identity_image_kind');

  if (error) throw error;

  const rows = (data || []) as ProfileRow[];
  const users = await Promise.all(rows.map(rowToUser));
  const current = users.find((user) => user.id === currentUserId);
  const currentRow = rows.find((row) => row.id === currentUserId);
  if (!current || !currentRow) throw new Error('No se encontró el perfil asociado a la sesión.');

  localStorage.setItem(LOCAL.users, JSON.stringify(users));
  localStorage.setItem(LOCAL.currentUser, JSON.stringify(current));
  localStorage.setItem(LOCAL.onboarded, String(Boolean(currentRow.onboarding_completed)));
  localStorage.setItem(LOCAL.country, current.countryCode || 'ES');
  return { users, currentUser: current };
};

export const uploadIdentityDataUrl = async (
  userId: string,
  dataUrl: string | undefined,
  kind: 'avatar' | 'logo'
) => {
  if (!dataUrl) return;

  const authenticatedUser = await requireAuthenticatedUser(userId);
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const contentType = blob.type || 'image/jpeg';
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const path = `${authenticatedUser.id}/identity.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('labora-identity')
    .upload(path, blob, { contentType, upsert: true, cacheControl: '3600' });
  if (uploadError) throw uploadError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ identity_image_path: path, identity_image_kind: kind })
    .eq('id', authenticatedUser.id);
  if (profileError) throw profileError;
};

export const signInRemote = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });
  if (error) throw error;
  if (!data.user) throw new Error('No se pudo iniciar la sesión.');

  const pendingRaw = localStorage.getItem(LOCAL.pendingIdentity);
  if (pendingRaw) {
    try {
      const pending = JSON.parse(pendingRaw) as { email: string; image?: string; kind: 'avatar' | 'logo' };
      if (pending.email === data.user.email && pending.image) {
        await uploadIdentityDataUrl(data.user.id, pending.image, pending.kind);
        localStorage.removeItem(LOCAL.pendingIdentity);
      }
    } catch {
      // A pending local image must never block a valid sign in.
    }
  }

  await loadRemoteWorkspace(data.user.id);
  return data.user;
};

export const signUpRemote = async (
  userData: Partial<User>,
  password: string,
  identityImage?: string
) => {
  const role = userData.role || UserRole.RIDER;
  const email = userData.email?.trim().toLowerCase();
  if (!email) throw new Error('El correo es obligatorio.');

  // Gestorías: never allow role=manager without valid company NIF + collegiate number.
  // Autónomos (riders) stay open — no invite wall / pending queue.
  let nif = userData.nif?.trim().toUpperCase() || '';
  let companyName = userData.companyName?.trim() || '';
  let collegiateNumber = userData.collegiateNumber?.trim() || '';

  if (role === UserRole.MANAGER) {
    const secured = assertManagerSignupFields({
      companyName: companyName || userData.name,
      nif,
      collegiateNumber
    });
    companyName = secured.companyName;
    nif = secured.nif;
    collegiateNumber = secured.collegiateNumber;
  }

  const metadata = {
    role: roleToDb(role),
    name: userData.name?.trim() || 'Usuario',
    phone: userData.phone || '',
    nif,
    company_name: companyName,
    collegiate_number: collegiateNumber,
    fiscal_regime: userData.fiscalRegime || '',
    iae_code: userData.iaeCode || '',
    social_security_type: userData.socialSecurityType || '',
    vehicle_type: userData.vehicleType || '',
    vehicle_plate: userData.vehiclePlate || '',
    vehicle_fuel: userData.vehicleFuel || '',
    country_code: userData.countryCode || 'ES'
  };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
  if (error) throw error;
  if (!data.user) throw new Error('No se pudo crear la cuenta.');

  if (identityImage) {
    const kind = role === UserRole.MANAGER ? 'logo' : 'avatar';
    if (data.session) {
      await uploadIdentityDataUrl(data.user.id, identityImage, kind);
    } else {
      localStorage.setItem(LOCAL.pendingIdentity, JSON.stringify({ email, image: identityImage, kind }));
    }
  }

  if (data.session) {
    await loadRemoteWorkspace(data.user.id);
  }

  return { user: data.user, session: data.session };
};

export const signOutRemote = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem(LOCAL.users);
  localStorage.removeItem(LOCAL.currentUser);
  localStorage.removeItem(LOCAL.onboarded);
  localStorage.removeItem(LOCAL.country);
};

export const recoverRemoteSession = async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return false;
  await loadRemoteWorkspace(data.session.user.id);
  return true;
};

export const linkManagerByEmail = async (managerEmail: string) => {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error('Debes iniciar sesión.');

  const { error } = await supabase.rpc('link_manager_by_email', {
    manager_email: managerEmail.trim().toLowerCase()
  });
  if (error) throw error;

  await loadRemoteWorkspace(authData.user.id);
};

export const updateRemoteUserConfig = async (platforms: string[], banks: string[]) => {
  const authenticatedUser = await requireAuthenticatedUser();
  const normalizedPlatforms = Array.from(new Set(platforms.map((value) => value.trim()).filter(Boolean)));
  const normalizedBanks = Array.from(new Set(banks.map((value) => value.trim()).filter(Boolean)));

  const { error } = await supabase
    .from('profiles')
    .update({
      platforms: normalizedPlatforms,
      banks: normalizedBanks
    })
    .eq('id', authenticatedUser.id);

  if (error) throw error;
};

export const completeRemoteOnboarding = async () => {
  const authenticatedUser = await requireAuthenticatedUser();
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', authenticatedUser.id);
  if (error) throw error;
};

export const updateRemoteProfile = async (userId: string, patch: Partial<User>) => {
  const authenticatedUser = await requireAuthenticatedUser(userId);
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.phone !== undefined) payload.phone = patch.phone || null;
  if (patch.nif !== undefined) payload.nif = patch.nif || null;
  if (patch.companyName !== undefined) payload.company_name = patch.companyName || null;
  if (patch.collegiateNumber !== undefined) payload.collegiate_number = patch.collegiateNumber || null;
  if (patch.vehiclePlate !== undefined) payload.vehicle_plate = patch.vehiclePlate || null;
  if (patch.countryCode !== undefined) payload.country_code = patch.countryCode || 'ES';

  if (Object.keys(payload).length === 0) return;
  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', authenticatedUser.id);
  if (error) throw error;
};
