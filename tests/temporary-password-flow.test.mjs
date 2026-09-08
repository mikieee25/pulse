import assert from "node:assert/strict"
import test from "node:test"

import {
  buildTemporaryUserAttributes,
  getPasswordChangeRedirect,
  validatePasswordChange,
  validateTemporaryPassword,
} from "../src/lib/temporary-password.ts"

test("temporary accounts are confirmed and marked for a forced password change", () => {
  assert.deepEqual(buildTemporaryUserAttributes("viewer@example.com", "LongEnough12!"), {
    email: "viewer@example.com",
    password: "LongEnough12!",
    email_confirm: true,
    app_metadata: { must_change_password: true },
  })
})

test("temporary passwords require at least 12 characters", () => {
  assert.equal(validateTemporaryPassword("Short12345!"), "Password must be at least 12 characters.")
  assert.equal(validateTemporaryPassword("LongEnough12!"), null)
})

test("new password and confirmation must match", () => {
  assert.equal(validatePasswordChange("LongEnough12!", "Different123!"), "Passwords do not match.")
  assert.equal(validatePasswordChange("LongEnough12!", "LongEnough12!"), null)
})

test("flagged users are restricted to the password-change flow", () => {
  assert.equal(getPasswordChangeRedirect("/", true), "/change-password")
  assert.equal(getPasswordChangeRedirect("/equipment", true), "/change-password")
  assert.equal(getPasswordChangeRedirect("/change-password", true), null)
  assert.equal(getPasswordChangeRedirect("/auth/change-password", true), null)
  assert.equal(getPasswordChangeRedirect("/auth/logout", true), null)
  assert.equal(getPasswordChangeRedirect("/equipment", false), null)
})
