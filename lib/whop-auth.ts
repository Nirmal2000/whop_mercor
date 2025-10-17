import { WhopServerSdk } from "@whop/api";
import { headers } from "next/headers";

const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
const apiKey = process.env.WHOP_API_KEY;
const agentUserId = process.env.WHOP_AGENT_USER_ID;
const companyId = process.env.WHOP_COMPANY_ID;

if (!appId || !apiKey || !agentUserId || !companyId) {
  throw new Error(
    "Missing Whop environment variables. Check NEXT_PUBLIC_WHOP_APP_ID, WHOP_API_KEY, WHOP_AGENT_USER_ID, and WHOP_COMPANY_ID."
  );
}

export const whopSdk = WhopServerSdk({
  appId,
  appApiKey: apiKey,
  onBehalfOfUserId: agentUserId,
  companyId
});

type AccessLevel = "no_access" | "member" | "manager" | "admin";

interface AuthResult {
  userId: string;
  accessLevel: AccessLevel;
}

/**
 * Verifies the calling user has access to the Whop experience and optionally
 * enforces an access level (e.g., admin).
 */
export async function verifyExperienceAccess(
  experienceId: string,
  requiredLevel?: "admin"
): Promise<AuthResult> {
  const headerList = await headers();
  const { userId } = await whopSdk.verifyUserToken(headerList);

  const { accessLevel } =
    await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId
    });

  if (requiredLevel && accessLevel !== requiredLevel) {
    console.warn(`[whop-auth] Admin level required for experience ${experienceId}`, { userId, accessLevel });
    throw new Error("User must be an admin to access this resource.");
  }

  if (accessLevel === "no_access") {
    console.warn(`[whop-auth] User ${userId} lacks access to experience ${experienceId}`);
    throw new Error("User does not have access to this experience.");
  }

  return { userId, accessLevel };
}

/**
 * Returns whether the user is an admin for the configured Whop company.
 */
export async function isCompanyAdmin(userId: string): Promise<boolean> {
  const { accessLevel } =
    await whopSdk.access.checkIfUserHasAccessToCompany({
      companyId,
      userId
    });

  return accessLevel === "admin";
}

/**
 * Throws if the user is not a Whop company admin.
 */
export async function requireCompanyAdmin(userId: string): Promise<void> {
  const admin = await isCompanyAdmin(userId);
  if (!admin) {
    console.warn(
      `[whop-auth] Company admin access denied for user ${userId}`,
      { userId }
    );
    throw new Error("User must be a company admin.");
  }
}

export async function requireWhopCompanyAdmin(): Promise<string> {
  const headerList = await headers();
  const { userId } = await whopSdk.verifyUserToken(headerList);
  await requireCompanyAdmin(userId);
  return userId;
}
