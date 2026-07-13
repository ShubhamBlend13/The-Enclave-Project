import { createClient } from "supabase";

const AUTH_ALIAS_DOMAIN =
  "auth.enclave.example.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  employee_id: string | null;
  home_villa_id: string | null;
  role:
    | "owner_admin"
    | "villa_admin"
    | "resident"
    | "upkeep_manager";
  must_change_password: boolean;
  is_active: boolean;
  created_at?: string;
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function requireString(
  value: unknown,
  fieldName: string,
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new HttpError(
      400,
      `${fieldName} is required.`,
    );
  }

  return value.trim();
}

function normalizePhone(value: unknown) {
  const raw = requireString(
    value,
    "Phone number",
  );

  const digits = raw.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return `+${digits}`;
  }

  throw new HttpError(
    400,
    "Enter a valid 10-digit Indian phone number.",
  );
}

function normalizeEmployeeId(value: unknown) {
  const employeeId = requireString(
    value,
    "Employee ID",
  ).toUpperCase();

  if (!/^[A-Z0-9-]{3,30}$/.test(employeeId)) {
    throw new HttpError(
      400,
      "Enter a valid employee ID.",
    );
  }

  return employeeId;
}

function validateTemporaryPassword(
  value: unknown,
) {
  if (
    typeof value !== "string" ||
    value.length < 8
  ) {
    throw new HttpError(
      400,
      "Temporary password must have at least 8 characters.",
    );
  }

  return value;
}

function getPhoneAuthEmail(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return `phone_${digits}@${AUTH_ALIAS_DOMAIN}`;
}

function getEmployeeAuthEmail(
  employeeId: string,
) {
  const safeEmployeeId = employeeId
    .toLowerCase()
    .replace(/-/g, "_");

  return `employee_${safeEmployeeId}@${AUTH_ALIAS_DOMAIN}`;
}

function canManageTarget(
  caller: ProfileRow,
  target: ProfileRow,
) {
  if (
    caller.role === "owner_admin" &&
    ["villa_admin", "upkeep_manager"].includes(
      target.role,
    )
  ) {
    return true;
  }

  if (
    caller.role === "villa_admin" &&
    target.role === "resident" &&
    caller.home_villa_id !== null &&
    caller.home_villa_id ===
      target.home_villa_id
  ) {
    return true;
  }

  return false;
}

function mapProfile(
  profile: ProfileRow,
  homeAreaCode: string | null,
) {
  return {
    id: profile.id,
    fullName: profile.full_name,
    phone: profile.phone,
    employeeId: profile.employee_id,
    homeAreaCode,
    role: profile.role,
    mustChangePassword:
      profile.must_change_password,
    isActive: profile.is_active,
    createdAt: profile.created_at ?? null,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed.",
      },
      405,
    );
  }

  try {
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new HttpError(
        500,
        "Server configuration is incomplete.",
      );
    }

    const authorizationHeader =
      request.headers.get("Authorization");

    if (
      !authorizationHeader?.startsWith(
        "Bearer ",
      )
    ) {
      throw new HttpError(
        401,
        "Authentication is required.",
      );
    }

    const accessToken =
      authorizationHeader.slice(7);

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

    // getUser validates the supplied access token
    // with Supabase Auth before we authorize any action.
    const {
      data: { user: authenticatedUser },
      error: authenticatedUserError,
    } = await adminClient.auth.getUser(
      accessToken,
    );

    if (
      authenticatedUserError ||
      !authenticatedUser
    ) {
      throw new HttpError(
        401,
        "Your session is invalid or expired.",
      );
    }

    const {
      data: callerProfile,
      error: callerProfileError,
    } = await adminClient
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
          is_active,
          created_at
        `,
      )
      .eq("id", authenticatedUser.id)
      .single();

    if (
      callerProfileError ||
      !callerProfile
    ) {
      throw new HttpError(
        403,
        "Your application profile was not found.",
      );
    }

    const caller =
      callerProfile as ProfileRow;

    if (!caller.is_active) {
      throw new HttpError(
        403,
        "Your account is inactive.",
      );
    }

    const requestBody =
      await request.json();

    const action = requireString(
      requestBody.action,
      "Action",
    );

    // =====================================================
    // CREATE USER
    // =====================================================

    if (action === "create") {
      const fullName = requireString(
        requestBody.fullName,
        "Full name",
      );

      const targetRole = requireString(
        requestBody.role,
        "Role",
      ) as ProfileRow["role"];

      const temporaryPassword =
        validateTemporaryPassword(
          requestBody.temporaryPassword,
        );

      const ownerCreatingManagedUser =
        caller.role === "owner_admin" &&
        [
          "villa_admin",
          "upkeep_manager",
        ].includes(targetRole);

      const villaAdminCreatingResident =
        caller.role === "villa_admin" &&
        targetRole === "resident";

      if (
        !ownerCreatingManagedUser &&
        !villaAdminCreatingResident
      ) {
        throw new HttpError(
          403,
          "You do not have permission to create this account type.",
        );
      }

      let phone: string | null = null;
      let employeeId: string | null = null;
      let homeVillaId: string | null = null;
      let homeAreaCode: string | null = null;
      let authEmail: string;

      if (targetRole === "upkeep_manager") {
        employeeId = normalizeEmployeeId(
          requestBody.employeeId,
        );

        authEmail =
          getEmployeeAuthEmail(employeeId);
      } else {
        phone = normalizePhone(
          requestBody.phone,
        );

        authEmail =
          getPhoneAuthEmail(phone);

        if (caller.role === "villa_admin") {
          if (!caller.home_villa_id) {
            throw new HttpError(
              400,
              "Your account does not have a home villa.",
            );
          }

          const {
            data: callerHomeArea,
            error: callerHomeAreaError,
          } = await adminClient
            .from("areas")
            .select("id, code")
            .eq(
              "id",
              caller.home_villa_id,
            )
            .eq("type", "villa")
            .eq("is_active", true)
            .single();

          if (
            callerHomeAreaError ||
            !callerHomeArea
          ) {
            throw new HttpError(
              400,
              "Your assigned villa could not be found.",
            );
          }

          homeVillaId =
            callerHomeArea.id;
          homeAreaCode =
            callerHomeArea.code;
        } else {
          const requestedAreaCode =
            requireString(
              requestBody.homeAreaCode,
              "Home villa",
            ).toUpperCase();

          const {
            data: requestedArea,
            error: requestedAreaError,
          } = await adminClient
            .from("areas")
            .select("id, code")
            .eq("code", requestedAreaCode)
            .eq("type", "villa")
            .eq("is_active", true)
            .single();

          if (
            requestedAreaError ||
            !requestedArea
          ) {
            throw new HttpError(
              400,
              "Choose a valid active villa.",
            );
          }

          homeVillaId =
            requestedArea.id;
          homeAreaCode =
            requestedArea.code;
        }
      }

      const {
        data: createdAuthData,
        error: createdAuthError,
      } =
        await adminClient.auth.admin.createUser({
          email: authEmail,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            login_type:
              targetRole ===
              "upkeep_manager"
                ? "employee"
                : "phone",
          },
        });

      if (
        createdAuthError ||
        !createdAuthData.user
      ) {
        throw new HttpError(
          400,
          createdAuthError?.message ??
            "The Auth user could not be created.",
        );
      }

      const createdAuthUser =
        createdAuthData.user;

      const {
        data: createdProfile,
        error: createdProfileError,
      } = await adminClient
        .from("profiles")
        .insert({
          id: createdAuthUser.id,
          full_name: fullName,
          phone,
          employee_id: employeeId,
          home_villa_id: homeVillaId,
          role: targetRole,
          must_change_password: true,
          is_active: true,
          created_by: caller.id,
        })
        .select(
          `
            id,
            full_name,
            phone,
            employee_id,
            home_villa_id,
            role,
            must_change_password,
            is_active,
            created_at
          `,
        )
        .single();

      if (
        createdProfileError ||
        !createdProfile
      ) {
        // Do not leave an orphaned Auth user when
        // application-profile creation fails.
        await adminClient.auth.admin.deleteUser(
          createdAuthUser.id,
        );

        throw new HttpError(
          400,
          createdProfileError?.message ??
            "The profile could not be created.",
        );
      }

      return jsonResponse({
        user: mapProfile(
          createdProfile as ProfileRow,
          homeAreaCode,
        ),
      });
    }

    // =====================================================
    // RESET TEMPORARY PASSWORD
    // =====================================================

    if (action === "reset_password") {
      const targetUserId = requireString(
        requestBody.userId,
        "User ID",
      );

      const temporaryPassword =
        validateTemporaryPassword(
          requestBody.temporaryPassword,
        );

      if (targetUserId === caller.id) {
        throw new HttpError(
          403,
          "Use the normal password-change screen for your own account.",
        );
      }

      const {
        data: targetProfile,
        error: targetProfileError,
      } = await adminClient
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
            is_active,
            created_at
          `,
        )
        .eq("id", targetUserId)
        .single();

      if (
        targetProfileError ||
        !targetProfile
      ) {
        throw new HttpError(
          404,
          "The selected account was not found.",
        );
      }

      const target =
        targetProfile as ProfileRow;

      if (!canManageTarget(caller, target)) {
        throw new HttpError(
          403,
          "You do not have permission to reset this account.",
        );
      }

      const { error: authUpdateError } =
        await adminClient.auth.admin.updateUserById(
          targetUserId,
          {
            password: temporaryPassword,
          },
        );

      if (authUpdateError) {
        throw new HttpError(
          400,
          authUpdateError.message,
        );
      }

      const {
        data: updatedProfile,
        error: updatedProfileError,
      } = await adminClient
        .from("profiles")
        .update({
          must_change_password: true,
        })
        .eq("id", targetUserId)
        .select(
          `
            id,
            full_name,
            phone,
            employee_id,
            home_villa_id,
            role,
            must_change_password,
            is_active,
            created_at
          `,
        )
        .single();

      if (
        updatedProfileError ||
        !updatedProfile
      ) {
        throw new HttpError(
          500,
          "The password changed, but the profile flag could not be updated.",
        );
      }

      return jsonResponse({
        userId: targetUserId,
        mustChangePassword: true,
      });
    }

    // =====================================================
    // ACTIVATE / DEACTIVATE ACCOUNT
    // =====================================================

    if (action === "set_active") {
      const targetUserId = requireString(
        requestBody.userId,
        "User ID",
      );

      if (
        typeof requestBody.isActive !==
        "boolean"
      ) {
        throw new HttpError(
          400,
          "isActive must be true or false.",
        );
      }

      if (targetUserId === caller.id) {
        throw new HttpError(
          403,
          "You cannot deactivate your own account.",
        );
      }

      const {
        data: targetProfile,
        error: targetProfileError,
      } = await adminClient
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
            is_active,
            created_at
          `,
        )
        .eq("id", targetUserId)
        .single();

      if (
        targetProfileError ||
        !targetProfile
      ) {
        throw new HttpError(
          404,
          "The selected account was not found.",
        );
      }

      const target =
        targetProfile as ProfileRow;

      if (!canManageTarget(caller, target)) {
        throw new HttpError(
          403,
          "You do not have permission to change this account.",
        );
      }

      const {
        data: updatedProfile,
        error: updatedProfileError,
      } = await adminClient
        .from("profiles")
        .update({
          is_active: requestBody.isActive,
        })
        .eq("id", targetUserId)
        .select(
          `
            id,
            full_name,
            phone,
            employee_id,
            home_villa_id,
            role,
            must_change_password,
            is_active,
            created_at
          `,
        )
        .single();

      if (
        updatedProfileError ||
        !updatedProfile
      ) {
        throw new HttpError(
          400,
          updatedProfileError?.message ??
            "The account could not be updated.",
        );
      }

      return jsonResponse({
        userId: targetUserId,
        isActive:
          updatedProfile.is_active,
      });
    }

    throw new HttpError(
      400,
      "Unsupported account-management action.",
    );
  } catch (error) {
    console.error(error);

    if (error instanceof HttpError) {
      return jsonResponse(
        {
          error: error.message,
        },
        error.status,
      );
    }

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected server error occurred.",
      },
      500,
    );
  }
});