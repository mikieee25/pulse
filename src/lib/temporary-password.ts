export const MIN_PASSWORD_LENGTH = 12

export function buildTemporaryUserAttributes(email: string, password: string) {
  return {
    email,
    password,
    email_confirm: true,
    app_metadata: { must_change_password: true },
  }
}

export function validateTemporaryPassword(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH ? null : `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
}

export function validatePasswordChange(password: string, confirmation: string) {
  return validateTemporaryPassword(password) || (password === confirmation ? null : "Passwords do not match.")
}

export function getPasswordChangeRedirect(pathname: string, mustChangePassword: boolean) {
  if (!mustChangePassword) return null
  if (["/change-password", "/auth/change-password", "/auth/logout"].includes(pathname)) return null
  return "/change-password"
}
