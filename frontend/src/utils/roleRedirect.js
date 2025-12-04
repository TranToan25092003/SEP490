const ROLE_PRIORITY = ["admin", "manager", "staff", "technician", "customer"];

const ROLE_ROUTE_MAP = {
  admin: "/admin",
  manager: "/manager",
  staff: "/staff",
  technician: "/staff",
  customer: "/",
  default: "/",
};

const ROLE_ALIASES = {
  "org:admin": "admin",
  "org:admin_secondary": "admin",
  "org:manager": "manager",
  "org:member": "staff",
  "org:staff": "staff",
};

const KNOWN_KEYWORDS = [
  { keyword: "admin", normalized: "admin" },
  { keyword: "manager", normalized: "manager" },
  { keyword: "staff", normalized: "staff" },
  { keyword: "technician", normalized: "technician" },
  { keyword: "customer", normalized: "customer" },
];

function addValue(values, value) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => addValue(values, item));
    return;
  }
  if (typeof value === "string" && value.trim() !== "") {
    values.add(value);
    return;
  }
  if (typeof value === "object" && value !== null) {
    Object.values(value).forEach((item) => addValue(values, item));
  }
}

function normalizeRoleValue(raw) {
  if (!raw || typeof raw !== "string") return null;
  const lower = raw.toLowerCase();
  if (ROLE_ALIASES[lower]) return ROLE_ALIASES[lower];

  const keywordMatch = KNOWN_KEYWORDS.find(({ keyword }) =>
    lower.includes(keyword)
  );

  if (keywordMatch) {
    return keywordMatch.normalized;
  }

  return lower;
}

export function extractRolesFromUser(user) {
  if (!user) return [];
  const values = new Set();

  addValue(values, user.publicMetadata?.role);
  addValue(values, user.publicMetadata?.roles);
  addValue(values, user.publicMetadata?.primaryRole);
  addValue(values, user.publicMetadata?.userType);

  addValue(values, user.privateMetadata?.role);
  addValue(values, user.privateMetadata?.roles);

  addValue(values, user.unsafeMetadata?.role);
  addValue(values, user.unsafeMetadata?.roles);

  if (Array.isArray(user.organizationMemberships)) {
    user.organizationMemberships.forEach((membership) => {
      addValue(values, membership?.role);
      addValue(values, membership?.publicMetadata?.role);
      addValue(values, membership?.publicMetadata?.roles);
    });
  }

  const normalized = Array.from(values).map(normalizeRoleValue).filter(Boolean);

  if (!normalized.length) {
    return ["customer"];
  }

  return normalized;
}

export function getPrimaryRole(user) {
  const roles = extractRolesFromUser(user);
  for (const priorityRole of ROLE_PRIORITY) {
    if (roles.includes(priorityRole)) {
      return priorityRole;
    }
  }
  return roles[0] || "customer";
}

export function getRoleRedirectPath(user) {
  const primaryRole = getPrimaryRole(user);
  return ROLE_ROUTE_MAP[primaryRole] || ROLE_ROUTE_MAP.default;
}
