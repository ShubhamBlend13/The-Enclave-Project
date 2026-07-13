import { supabase } from "../lib/supabase";
import {
  getEmployeeAuthEmail,
  getPhoneAuthEmail,
} from "../utils/authIdentity";

export async function signInWithIdentity({
  identityType,
  identity,
  password,
}) {
  const email =
    identityType === "employee"
      ? getEmployeeAuthEmail(identity)
      : getPhoneAuthEmail(identity);

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error || !data.session) {
    throw new Error(
      "The login details are incorrect.",
    );
  }

  return data.session;
}

export async function loadCurrentProfile(userId) {
  const { data: profileRow, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        `
          id,
          full_name,
          phone,
          employee_id,
          home_villa_id,
          role,
          must_change_password,
          is_active
        `,
      )
      .eq("id", userId)
      .single();

  if (profileError || !profileRow) {
    throw new Error(
      "Your application profile could not be loaded.",
    );
  }

  let homeAreaCode = null;

  // Inactive users do not need further area data because the app blocks access.
  if (
    profileRow.home_villa_id &&
    profileRow.is_active
  ) {
    const { data: homeArea, error: areaError } =
      await supabase
        .from("areas")
        .select("code")
        .eq("id", profileRow.home_villa_id)
        .single();

    if (areaError || !homeArea) {
      throw new Error(
        "Your assigned villa could not be loaded.",
      );
    }

    homeAreaCode = homeArea.code;
  }

  // Convert database snake_case fields to the shape used by the React app.
  return {
    id: profileRow.id,
    fullName: profileRow.full_name,
    phone: profileRow.phone,
    employeeId: profileRow.employee_id,
    homeAreaCode,
    role: profileRow.role,
    mustChangePassword:
      profileRow.must_change_password,
    isActive: profileRow.is_active,
  };
}

export async function changeCurrentPassword(
  newPassword,
) {
  const { error: passwordError } =
    await supabase.auth.updateUser({
      password: newPassword,
    });

  if (passwordError) {
    throw new Error(
      passwordError.message ||
        "The password could not be changed.",
    );
  }

  const { error: profileError } =
    await supabase.rpc(
      "complete_password_change",
    );

  if (profileError) {
    throw new Error(
      "The password changed, but the profile could not be updated. Please try again.",
    );
  }
}

export async function signOutCurrentSession() {
  const { error } = await supabase.auth.signOut({
    scope: "local",
  });

  if (error) {
    throw new Error(
      "You could not be signed out.",
    );
  }
}