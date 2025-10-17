import { headers } from "next/headers";
import { whopSdk as baseWhopSdk } from "@/lib/whop-sdk";

type AccessLevel = "no_access" | "admin" | "customer";

interface AuthResult {
  userId: string;
  accessLevel: AccessLevel;
}

export const whopSdk = baseWhopSdk;

async function getUserIdFromRequest(): Promise<string> {
  const headerList = await headers();
  const { userId } = await whopSdk.verifyUserToken(headerList);
  return userId;
}

export async function verifyExperienceAccess(
  experienceId: string,
  requiredLevel?: "admin"
): Promise<AuthResult> {
  const userId = await getUserIdFromRequest();
  const { accessLevel } =
    await whopSdk.access.checkIfUserHasAccessToExperience({
      userId,
      experienceId
    });

  if (requiredLevel && accessLevel !== requiredLevel) {
    console.warn(
      `[whop-auth] Admin level required for experience ${experienceId}`,
      { userId, accessLevel }
    );
    throw new Error("User must be an admin to access this resource.");
  }

  if (accessLevel === "no_access") {
    console.warn(
      `[whop-auth] User ${userId} lacks access to experience ${experienceId}`
    );
    throw new Error("User does not have access to this experience.");
  }

  return { userId, accessLevel };
}

export async function getCompanyIdForExperience(
  experienceId: string
): Promise<string | null> {
  try {
    const experience = await whopSdk.experiences.getExperience({ experienceId });
    return experience.company?.id ?? null;
  } catch (error) {
    console.warn(
      `[whop-auth] Unable to resolve company for experience ${experienceId}`,
      error
    );
    return null;
  }
}

export async function isCompanyAdmin(
  userId: string,
  companyId: string
): Promise<boolean> {
  if (!companyId) {
    return false;
  }

  const { accessLevel } = await whopSdk.access.checkIfUserHasAccessToCompany({
    companyId,
    userId
  });

  return accessLevel === "admin";
}

export async function requireCompanyAdmin(
  userId: string,
  companyId: string
): Promise<void> {
  const admin = await isCompanyAdmin(userId, companyId);
  if (!admin) {
    console.warn(
      `[whop-auth] Company admin access denied for user ${userId}`,
      { userId, companyId }
    );
    throw new Error("User must be a company admin.");
  }
}

export async function requireWhopCompanyAdmin(
  companyId: string
): Promise<string> {
  if (!companyId) {
    throw new Error("companyId is required for admin verification");
  }

  const userId = await getUserIdFromRequest();
  await requireCompanyAdmin(userId, companyId);
  return userId;
}

