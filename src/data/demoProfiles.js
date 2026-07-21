import { getRoleLabel, USER_ROLES } from "../constants/roles";

// These profiles exist only for local development.
// Supabase Auth and real profile records will replace them later.
export const DEMO_PROFILES = [
  {
    id: "demo-s1-resident",
    label: "Resident · S1",
    fullName: "Peter Parker",
    role: USER_ROLES.RESIDENT,
    homeAreaCode: "S1",
  },
  {
    id: "demo-s1-admin",
    label: "Villa Admin · S1",
    fullName: "Tony Stark",
    role: USER_ROLES.VILLA_ADMIN,
    homeAreaCode: "S1",
  },
  {
    id: "demo-upkeep-manager",
    label: getRoleLabel(USER_ROLES.UPKEEP_MANAGER),
    fullName: "Iron Man",
    role: USER_ROLES.UPKEEP_MANAGER,
    homeAreaCode: null,
  },
  {
    id: "demo-owner-admin",
    label: "Owner Admin",
    fullName: "Nick Fury",
    role: USER_ROLES.OWNER_ADMIN,
    homeAreaCode: null,
  },
];