/**
 * Utility function để resolve tên nhân viên từ user object
 * Ưu tiên hiển thị thông tin cá nhân (publicMetadata) thay vì thông tin từ Google/Facebook
 *
 * @param {Object} user - User object từ Clerk hoặc API
 * @param {Object} options - Options object
 * @param {string} options.fallback - Fallback text nếu không tìm thấy tên (default: "Chưa cập nhật")
 * @returns {string} Tên nhân viên
 */
export function resolveStaffFullName(user, options = {}) {
  const { fallback = "Chưa cập nhật" } = options;

  if (!user) return fallback;

  // Ưu tiên hiển thị thông tin cá nhân (publicMetadata) thay vì thông tin từ Google/Facebook
  if (user.publicMetadata?.fullName) {
    return user.publicMetadata.fullName;
  }

  if (user.fullName) {
    return user.fullName;
  }

  // Thử compose từ firstName và lastName
  const composed = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (composed) {
    return composed;
  }

  // Fallback về email hoặc identifier
  const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
  if (primaryEmail) {
    return primaryEmail;
  }

  if (user.identifier) {
    return user.identifier;
  }

  return fallback;
}

/**
 * Resolve tên nhân viên từ membership object (từ Clerk organization)
 *
 * @param {Object} membership - Membership object từ Clerk
 * @param {Object} options - Options object
 * @param {string} options.fallback - Fallback text nếu không tìm thấy tên (default: "Chưa cập nhật")
 * @returns {string} Tên nhân viên
 */
export function resolveStaffFullNameFromMembership(membership, options = {}) {
  const { fallback = "Chưa cập nhật" } = options;

  if (!membership) return fallback;

  const publicUserData = membership.publicUserData ?? {};
  const memberMetadata = {
    ...(membership.publicMetadata ?? {}),
  };

  // Ưu tiên hiển thị thông tin cá nhân (publicMetadata) thay vì thông tin từ Google/Facebook
  const fullNameFromMetadata = memberMetadata.fullName;
  const fullNameFromGoogle = [publicUserData.firstName, publicUserData.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const fullName =
    fullNameFromMetadata ||
    fullNameFromGoogle ||
    publicUserData.identifier ||
    fallback;

  return fullName;
}
