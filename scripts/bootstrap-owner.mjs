import { createClient } from "@supabase/supabase-js";

import {
  getPhoneAuthEmail,
  normalizePhone,
} from "../src/utils/authIdentity.js";

function getRequiredEnvironmentValue(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

async function bootstrapOwner() {
  const supabaseUrl =
    getRequiredEnvironmentValue("SUPABASE_URL");

  const adminKey =
    getRequiredEnvironmentValue(
      "SUPABASE_ADMIN_KEY",
    );

  const fullName =
    getRequiredEnvironmentValue(
      "OWNER_FULL_NAME",
    );

  const phone = normalizePhone(
    getRequiredEnvironmentValue("OWNER_PHONE"),
  );

  const temporaryPassword =
    getRequiredEnvironmentValue(
      "OWNER_TEMP_PASSWORD",
    );

  if (temporaryPassword.length < 8) {
    throw new Error(
      "The temporary password must contain at least 8 characters.",
    );
  }

  const authEmail = getPhoneAuthEmail(phone);

  // This client uses the privileged key only inside this local bootstrap script.
  const adminClient = createClient(
    supabaseUrl,
    adminKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const {
    data: createdUserData,
    error: createUserError,
  } = await adminClient.auth.admin.createUser({
    email: authEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      login_type: "phone",
    },
  });

  if (createUserError) {
    throw new Error(
      `Could not create the Auth user: ${createUserError.message}`,
    );
  }

  const createdUser = createdUserData.user;

  if (!createdUser) {
    throw new Error(
      "Supabase did not return the created Auth user.",
    );
  }

  const { error: profileError } =
    await adminClient
      .from("profiles")
      .insert({
        id: createdUser.id,
        full_name: fullName,
        phone,
        employee_id: null,
        home_villa_id: null,
        role: "owner_admin",
        must_change_password: true,
        is_active: true,
        created_by: createdUser.id,
      });

  if (profileError) {
    // Avoid leaving an unusable Auth account if profile creation fails.
    await adminClient.auth.admin.deleteUser(
      createdUser.id,
    );

    throw new Error(
      `Could not create the owner profile: ${profileError.message}`,
    );
  }

  console.log("");
  console.log("Owner Admin created successfully.");
  console.log(`Name: ${fullName}`);
  console.log(`Phone: ${phone}`);
  console.log(`Auth user ID: ${createdUser.id}`);
  console.log(
    "The owner must change the temporary password after first login.",
  );
}

bootstrapOwner().catch((error) => {
  console.error("");
  console.error("Owner bootstrap failed.");
  console.error(error.message);
  process.exitCode = 1;
});