import { useMemo, useState } from "react";

import Btn from "../components/Btn";
import Chip from "../components/Chip";
import Field from "../components/Field";
import {
  AREAS,
  AREA_TYPES,
} from "../constants/areas";
import {
  isOwnerAdmin,
  isVillaAdmin,
  USER_ROLES,
} from "../constants/roles";
import { THEME } from "../constants/theme";
import {
  canManageUser,
  canViewUser,
} from "../utils/userAccess";

const INPUT_STYLE = {
  width: "100%",
  padding: "13px 14px",
  border: `1.5px solid ${THEME.line}`,
  borderRadius: 12,
  background: THEME.card,
  color: THEME.ink,
  fontSize: 15,
  outline: "none",
};

const ROLE_LABELS = {
  [USER_ROLES.OWNER_ADMIN]: "Owner Admin",
  [USER_ROLES.VILLA_ADMIN]: "Villa Admin",
  [USER_ROLES.RESIDENT]: "Resident",
  [USER_ROLES.UPKEEP_MANAGER]: "Upkeep Manager",
};

function AccountManagementPage({
  profile,
  users,
  onBack,
  onCreateUser,
  onResetPassword,
  onSetUserActive,
}) {
  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const visibleUsers = useMemo(
    () =>
      users.filter((user) =>
        canViewUser(profile, user),
      ),
    [profile, users],
  );

  const managedUsers = visibleUsers.filter(
    (user) => canManageUser(profile, user),
  );

  const residentOverview = isOwnerAdmin(profile)
    ? visibleUsers.filter(
        (user) =>
          user.role === USER_ROLES.RESIDENT,
      )
    : [];

  const title = isVillaAdmin(profile)
    ? `Villa ${profile.homeAreaCode} residents`
    : "Account management";

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 16,
          padding: 0,
          border: "none",
          background: "transparent",
          color: THEME.green,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        ← Back to Community
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: "4px 0",
              color: THEME.ink,
              fontFamily: "'Marcellus', serif",
              fontSize: 28,
              fontWeight: 400,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              margin: 0,
              color: THEME.mute,
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {isVillaAdmin(profile)
              ? "Create and manage resident access for your villa."
              : "Manage villa administrators and operational accounts."}
          </p>
        </div>

        {!showCreateForm && (
          <Btn
            variant="brass"
            onClick={() =>
              setShowCreateForm(true)
            }
            style={{
              width: "auto",
              padding: "10px 14px",
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            + Add account
          </Btn>
        )}
      </div>

      {showCreateForm && (
        <CreateAccountForm
          profile={profile}
          onCreate={async (formData) => {
            const created = await onCreateUser(
              formData,
            );

            if (created) {
              setShowCreateForm(false);
            }
          }}
          onCancel={() =>
            setShowCreateForm(false)
          }
        />
      )}

      <SectionLabel>
        {isVillaAdmin(profile)
          ? "Residents"
          : "Managed accounts"}
      </SectionLabel>

      {managedUsers.length === 0 ? (
        <EmptyUsers />
      ) : (
        managedUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            canManage
            onResetPassword={onResetPassword}
            onSetUserActive={onSetUserActive}
          />
        ))
      )}

      {isOwnerAdmin(profile) && (
        <>
          <SectionLabel>
            Resident overview
          </SectionLabel>

          {residentOverview.length === 0 ? (
            <EmptyUsers />
          ) : (
            residentOverview.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                canManage={false}
                onResetPassword={
                  onResetPassword
                }
                onSetUserActive={
                  onSetUserActive
                }
              />
            ))
          )}
        </>
      )}
    </section>
  );
}

function CreateAccountForm({
  profile,
  onCreate,
  onCancel,
}) {
  const ownerMode = isOwnerAdmin(profile);

  const [role, setRole] = useState(
    ownerMode
      ? USER_ROLES.VILLA_ADMIN
      : USER_ROLES.RESIDENT,
  );

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeId, setEmployeeId] =
    useState("");
  const [homeAreaCode, setHomeAreaCode] =
    useState(
      ownerMode ? "" : profile.homeAreaCode,
    );
  const [temporaryPassword, setTemporaryPassword] =
    useState("");
  const [saving, setSaving] = useState(false);

  const isUpkeepManager =
    role === USER_ROLES.UPKEEP_MANAGER;

  const canSubmit =
    Boolean(fullName.trim()) &&
    Boolean(
      isUpkeepManager
        ? employeeId.trim()
        : phone.trim(),
    ) &&
    Boolean(
      role === USER_ROLES.VILLA_ADMIN
        ? homeAreaCode
        : true,
    ) &&
    temporaryPassword.length >= 6 &&
    !saving;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSaving(true);

    try {
      await onCreate({
        fullName: fullName.trim(),
        phone: isUpkeepManager
          ? null
          : phone.trim(),
        employeeId: isUpkeepManager
          ? employeeId.trim()
          : null,
        role,
        homeAreaCode:
          role === USER_ROLES.RESIDENT
            ? profile.homeAreaCode
            : role === USER_ROLES.VILLA_ADMIN
              ? homeAreaCode
              : null,
        temporaryPassword,
      });
    } finally {
      setSaving(false);
    }
  };

  const villas = AREAS.filter(
    (area) => area.type === AREA_TYPES.VILLA,
  );

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 20,
        padding: 16,
        border: `1px solid ${THEME.line}`,
        borderRadius: 16,
        background: THEME.card,
      }}
    >
      <div
        style={{
          marginBottom: 14,
          color: THEME.ink,
          fontFamily: "'Marcellus', serif",
          fontSize: 18,
        }}
      >
        Create account
      </div>

      {ownerMode && (
        <Field label="Account type">
          <select
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
            style={INPUT_STYLE}
          >
            <option
              value={USER_ROLES.VILLA_ADMIN}
            >
              Villa Admin
            </option>

            <option
              value={
                USER_ROLES.UPKEEP_MANAGER
              }
            >
              Upkeep Manager
            </option>
          </select>
        </Field>
      )}

      <Field label="Full name">
        <input
          type="text"
          value={fullName}
          onChange={(event) =>
            setFullName(event.target.value)
          }
          placeholder="Enter full name"
          style={INPUT_STYLE}
        />
      </Field>

      {isUpkeepManager ? (
        <Field label="Employee ID">
          <input
            type="text"
            value={employeeId}
            onChange={(event) =>
              setEmployeeId(event.target.value)
            }
            placeholder="e.g. EMP-002"
            style={INPUT_STYLE}
          />
        </Field>
      ) : (
        <Field label="Phone">
          <input
            type="tel"
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="+91..."
            style={INPUT_STYLE}
          />
        </Field>
      )}

      {role === USER_ROLES.VILLA_ADMIN && (
        <Field label="Villa">
          <select
            value={homeAreaCode}
            onChange={(event) =>
              setHomeAreaCode(event.target.value)
            }
            style={INPUT_STYLE}
          >
            <option value="">
              Select a villa
            </option>

            {villas.map((villa) => (
              <option
                key={villa.code}
                value={villa.code}
              >
                {villa.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {!ownerMode && (
        <div
          style={{
            marginBottom: 18,
            padding: "11px 13px",
            borderRadius: 12,
            background: THEME.greenSoft,
            color: THEME.green,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Resident will belong to Villa{" "}
          {profile.homeAreaCode}.
        </div>
      )}

      <Field label="Temporary password">
        <input
          type="password"
          value={temporaryPassword}
          onChange={(event) =>
            setTemporaryPassword(
              event.target.value,
            )
          }
          placeholder="Minimum 6 characters"
          style={INPUT_STYLE}
        />
      </Field>

      <div
        style={{
          color: THEME.mute,
          margin: "-8px 0 16px",
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        The user will be required to change this
        password after signing in.
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <Btn
          variant="ghost"
          onClick={onCancel}
          style={{
            flex: 1,
          }}
        >
          Cancel
        </Btn>

        <Btn
          type="submit"
          disabled={!canSubmit}
          style={{
            flex: 2,
          }}
        >
          {saving
            ? "Creating..."
            : "Create account"}
        </Btn>
      </div>
    </form>
  );
}

function UserCard({
  user,
  canManage,
  onResetPassword,
  onSetUserActive,
}) {
  const [resetting, setResetting] =
    useState(false);

  const [temporaryPassword, setTemporaryPassword] =
    useState("");

  const roleLabel =
    ROLE_LABELS[user.role] ?? user.role;

  const areaLabel = user.homeAreaCode
    ? `Villa ${user.homeAreaCode}`
    : null;

  const identity =
    user.employeeId ?? user.phone;

  const handlePasswordReset = async () => {
    if (temporaryPassword.length < 6) {
      return;
    }

    const reset = await onResetPassword(
      user.id,
      temporaryPassword,
    );

    if (reset) {
      setTemporaryPassword("");
      setResetting(false);
    }
  };

  return (
    <article
      style={{
        marginBottom: 10,
        padding: 16,
        border: `1px solid ${THEME.line}`,
        borderRadius: 16,
        background: THEME.card,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              color: THEME.ink,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {user.fullName}
          </div>

          <div
            style={{
              marginTop: 3,
              color: THEME.mute,
              fontSize: 12.5,
              lineHeight: 1.45,
            }}
          >
            {roleLabel}

            {areaLabel && (
              <>
                {" · "}
                {areaLabel}
              </>
            )}

            {identity && (
              <>
                <br />
                {identity}
              </>
            )}
          </div>
        </div>

        <Chip
          color={
            user.isActive
              ? THEME.ok
              : THEME.red
          }
          background={
            user.isActive
              ? "#E2EFE7"
              : "#F7E6E0"
          }
        >
          {user.isActive
            ? "Active"
            : "Inactive"}
        </Chip>
      </div>

      {user.mustChangePassword && (
        <div
          style={{
            marginTop: 10,
            color: THEME.amber,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Password change required at next login
        </div>
      )}

      {canManage && (
        <>
          {resetting && (
            <div
              style={{
                marginTop: 14,
              }}
            >
              <input
                type="password"
                value={temporaryPassword}
                onChange={(event) =>
                  setTemporaryPassword(
                    event.target.value,
                  )
                }
                placeholder="New temporary password"
                style={{
                  ...INPUT_STYLE,
                  marginBottom: 8,
                }}
              />

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <Btn
                  variant="ghost"
                  onClick={() => {
                    setTemporaryPassword("");
                    setResetting(false);
                  }}
                  style={{
                    flex: 1,
                  }}
                >
                  Cancel
                </Btn>

                <Btn
                  disabled={
                    temporaryPassword.length < 6
                  }
                  onClick={handlePasswordReset}
                  style={{
                    flex: 2,
                  }}
                >
                  Set temporary password
                </Btn>
              </div>
            </div>
          )}

          {!resetting && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
              }}
            >
              <Btn
                variant="quiet"
                onClick={() =>
                  setResetting(true)
                }
                style={{
                  flex: 1,
                  fontSize: 12.5,
                }}
              >
                Reset password
              </Btn>

              <Btn
                variant="ghost"
                onClick={() =>
                  onSetUserActive(
                    user.id,
                    !user.isActive,
                  )
                }
                style={{
                  flex: 1,
                  fontSize: 12.5,
                }}
              >
                {user.isActive
                  ? "Deactivate"
                  : "Reactivate"}
              </Btn>
            </div>
          )}
        </>
      )}
    </article>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        margin: "24px 0 10px",
        color: THEME.mute,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function EmptyUsers() {
  return (
    <div
      style={{
        padding: 28,
        border: `1px solid ${THEME.line}`,
        borderRadius: 16,
        background: THEME.card,
        color: THEME.mute,
        fontSize: 13.5,
        textAlign: "center",
      }}
    >
      No accounts found.
    </div>
  );
}

export default AccountManagementPage;