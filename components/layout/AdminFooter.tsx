import Link from "next/link";
import { headers } from "next/headers";
import { whopSdk } from "@/lib/whop-sdk";
import { requireCompanyAdmin } from "@/lib/whop-auth";

interface AdminFooterProps {
  experienceId?: string;
}

export async function AdminFooter({ experienceId }: AdminFooterProps) {
  if (!experienceId) {
    return null;
  }

  try {
    const headerList = await headers();
    const { userId } = await whopSdk.verifyUserToken(headerList);
    const experience = await whopSdk.experiences.getExperience({ experienceId });
    const companyId = experience.company?.id;

    if (!companyId) {
      console.warn("[admin-footer] Experience missing company id", {
        experienceId
      });
      return null;
    }

    await requireCompanyAdmin(userId, companyId);

    const companyTitle = experience.company?.title ?? null;

    return (
      <div className="flex flex-col items-center gap-3 py-6 text-white/70">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/dashboard/${companyId}/listings`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-whopPrimary px-4 py-2 text-sm font-semibold text-white transition hover:shadow-card"
          >
            Open Analytics Dashboard
          </Link>
          <Link
            href={`/experiences/${experienceId}/listings`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-whopPrimary hover:bg-whopPrimary/10"
          >
            Back to Listings
          </Link>
        </div>
        <p className="text-xs text-white/50 text-center">
          {companyTitle ? `${companyTitle} admins` : "Admins"} can refresh referrals data, review engagement metrics, and return to the public listings experience.
        </p>
      </div>
    );
  } catch (error) {
    console.warn("[admin-footer] Unable to render admin footer", error);
    return null;
  }
}
