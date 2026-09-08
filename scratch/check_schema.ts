import { z } from "zod";

const userInput = z.object({ email: z.email(), full_name: z.string().trim().min(1), role: z.enum(["Admin", "Viewer"]), division_scope: z.string().uuid().nullable() })
const newUserInput = userInput.extend({ temporary_password: z.string() })

const payload = { email: "test@doe.gov.ph", full_name: "Test", temporary_password: "Password123!", role: "Admin", division_scope: null };
console.log("SafeParse result:", JSON.stringify(newUserInput.safeParse(payload)));
