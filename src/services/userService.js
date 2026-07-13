import { supabase } from "../lib/supabase";

const PROFILE_SELECT = `
  id,
  full_name,
  phone,
  employee_id,
  home_villa_id,
  role,
  must_change_password,
  is_active,
  created_at,
  home_area:areas!profiles_home_villa_id_fkey (
    id,
    code,
    name,
    type
  )
`;

function mapUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    employeeId: row.employee_id,
    homeVillaId: row.home_villa_id,
    homeAreaCode: row.home_area?.code ?? null,
    homeAreaName: row.home_area?.name ?? null,
    role: row.role,
    mustChangePassword:
      row.must_change_password,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

async function getFunctionErrorMessage(error) {
  const fallbackMessage =
    error?.message ||
    "The account-management request failed.";

  const response = error?.context;

  if (!(response instanceof Response)) {
    return fallbackMessage;
  }

  try {
    const errorBody =
      await response.clone().json();

    if (
      typeof errorBody?.error === "string" &&
      errorBody.error.trim()
    ) {
      return errorBody.error;
    }
  } catch {
    // Keep the original Supabase message when
    // the response body is not valid JSON.
  }

  return fallbackMessage;
}

async function invokeManageUser(body) {
  const { data, error } =
    await supabase.functions.invoke(
      "manage-user",
      {
        body,
      },
    );

  if (error) {
    throw new Error(
      await getFunctionErrorMessage(error),
    );
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function loadVisibleUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .order("full_name", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Accounts could not be loaded: ${error.message}`,
    );
  }

  return (data ?? []).map(mapUser);
}

export async function createManagedUser({
  fullName,
  role,
  phone = null,
  employeeId = null,
  homeAreaCode = null,
  temporaryPassword,
}) {
  const data = await invokeManageUser({
    action: "create",
    fullName,
    role,
    phone,
    employeeId,
    homeAreaCode,
    temporaryPassword,
  });

  if (!data?.user) {
    throw new Error(
      "The account was created, but no profile was returned.",
    );
  }

  return data.user;
}

export async function resetManagedUserPassword({
  userId,
  temporaryPassword,
}) {
  const data = await invokeManageUser({
    action: "reset_password",
    userId,
    temporaryPassword,
  });

  return {
    userId: data.userId,
    mustChangePassword:
      data.mustChangePassword,
  };
}

export async function setManagedUserActive({
  userId,
  isActive,
}) {
  const data = await invokeManageUser({
    action: "set_active",
    userId,
    isActive,
  });

  return {
    userId: data.userId,
    isActive: data.isActive,
  };
}