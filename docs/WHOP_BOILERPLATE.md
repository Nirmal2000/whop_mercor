# Whop App Boilerplate

Complete standalone documentation with all Whop-specific code patterns needed to build a new Whop app. Copy and paste the code sections into your project.

## Required Environment Variables

Set these in your `.env.local` file:

```
WHOP_API_KEY="get_this_from_the_whop_com_dashboard_under_apps"
WHOP_WEBHOOK_SECRET="get_this_after_creating_a_webhook_in_the_app_settings_screen"
WHOP_AGENT_USER_ID="use_any_whop_user_id_your_app_can_control"
NEXT_PUBLIC_WHOP_APP_ID="use_the_corresponding_app_id_to_the_secret_api_key"
WHOP_COMPANY_ID="company_of_the_app_company"
```

## Install Dependencies

```bash
pnpm add @whop/api @whop/react
```

## lib/whop-sdk.ts

```typescript
import { WhopServerSdk } from "@whop/api";

export const whopSdk = WhopServerSdk({
	appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",
	appApiKey: process.env.WHOP_API_KEY ?? "fallback",
	onBehalfOfUserId: process.env.WHOP_AGENT_USER_ID,
	companyId: process.env.WHOP_COMPANY_ID,
});
```

## lib/authentication.ts

```typescript
import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { cache } from "react";

export const verifyUser = cache(
	async (experienceId: string, level?: "admin") => {
		const headersList = await headers();
		const { userId } = await whopSdk.verifyUserToken(headersList);

		const { accessLevel } =
			await whopSdk.access.checkIfUserHasAccessToExperience({
				userId,
				experienceId,
			});

		if (level && accessLevel !== level) {
			throw new Error("User must be an admin to access this page");
		}
		if (accessLevel === "no_access") {
			throw new Error("User does not have access to experience");
		}

		return { userId, accessLevel };
	},
);

export async function verifyCompanyAdmin(companyId: string, userId: string) {
	const { accessLevel } = await whopSdk.access.checkIfUserHasAccessToCompany({
		companyId,
		userId,
	});
	return accessLevel === "admin";
}
```

## app/layout.tsx (Root Layout)

```typescript
import { WhopIframeSdkProvider, WhopThemeScript } from "@whop/react";
import { Theme } from "@whop/react/components";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Whop App",
	description: "My Whop App",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<WhopThemeScript />
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Theme accentColor="blue">
					<WhopIframeSdkProvider>{children}</WhopIframeSdkProvider>
				</Theme>
			</body>
		</html>
	);
}
```

## app/dashboard/[companyId]/page.tsx (Company Admin Route)

```typescript
import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	if (!(await isAdmin(companyId))) {
		return <AccessDenied />;
	}

	return <CompanyDashboardContent />;
}

async function isAdmin(companyId: string) {
	try {
		const { userId } = await whopSdk.verifyUserToken(await headers());
		const { accessLevel } = await whopSdk.access.checkIfUserHasAccessToCompany({
			companyId,
			userId,
		});
		return accessLevel === "admin";
	} catch (error) {
		return false;
	}
}

function AccessDenied() {
	return <div>You do not have access to this page.</div>;
}

function CompanyDashboardContent() {
	return <div>Company Admin Dashboard</div>;
}
```

## app/experiences/[experienceId]/layout.tsx (Experience Layout)

```typescript
import { WhopWebsocketProvider } from "@whop/react/websockets";

export default async function ExperienceLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	return (
		<WhopWebsocketProvider joinExperience={experienceId}>
			<div className="flex flex-col gap-4 max-w-3xl mx-auto p-4">
				{children}
			</div>
		</WhopWebsocketProvider>
	);
}
```

## app/experiences/[experienceId]/page.tsx (Experience Route)

```typescript
import { verifyUser } from "@/lib/authentication";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const { accessLevel } = await verifyUser(experienceId);

	if (accessLevel === "admin") {
		return <AdminExperienceView experienceId={experienceId} />;
	} else if (accessLevel === "basic") {
		return <UserExperienceView experienceId={experienceId} />;
	}

	return <AccessDenied />;
}

function AccessDenied() {
	return <div>You do not have access to this experience.</div>;
}

function AdminExperienceView({ experienceId }: { experienceId: string }) {
	return <div>Admin view for experience {experienceId}</div>;
}

function UserExperienceView({ experienceId }: { experienceId: string }) {
	return <div>User view for experience {experienceId}</div>;
}
```

## app/api/webhooks/route.ts (Webhook Handler)

```typescript
import { whopSdk } from "@/lib/whop-sdk";
import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	const webhookData = await validateWebhook(request);

	if (webhookData.action === "payment.succeeded") {
		await handlePaymentSucceeded(webhookData.data);
	}

	return new Response("OK", { status: 200 });
}

async function handlePaymentSucceeded(data: any) {
	const {
		id: receiptId,
		final_amount,
		amount_after_fees,
		currency,
		user_id,
		metadata,
	} = data;

	console.log(
		`Payment ${receiptId} succeeded for ${user_id} with amount ${final_amount} ${currency}`,
	);

	if (!user_id || !amount_after_fees) return;

	// Process your app logic here (e.g., unlock content, record purchases, etc.)
	waitUntil(sendNotification(data));
}

async function sendNotification(data: any) {
	try {
		await whopSdk.notifications.sendPushNotification({
			title: "Payment Received",
			content: `Received payment of ${data.final_amount} ${data.currency}`,
			experienceId: data.metadata?.experienceId || "exp_xxx",
			senderUserId: data.user_id,
		});
	} catch (error) {
		console.error("Failed to send notification:", error);
	}
}
```

## Usage Examples

### Server Action with Authentication

```typescript
"use server";

import { verifyUser } from "@/lib/authentication";
import { whopSdk } from "@/lib/whop-sdk";
import { redirect } from "next/navigation";

export async function createSomething(formData: FormData) {
	const experienceId = formData.get("experienceId") as string;
	const { userId } = await verifyUser(experienceId, "admin");

	// Create something in your database...

	await whopSdk.notifications.sendPushNotification({
		title: "New Item Created",
		content: "Something exciting happened!",
		experienceId,
		senderUserId: userId,
	});

	redirect(`/experiences/${experienceId}`);
}
```

### Real-time Messages

```typescript
// Send real-time message
await whopSdk.websockets.sendMessage({
	target: { experience: experienceId },
	message: JSON.stringify({ type: "update", data: payload }),
});

// Receive messages in client component
import { useWhopWebsocket } from "@whop/react/websockets";

function MyComponent() {
	useWhopWebsocket("experience-update", (message) => {
		// Handle real-time update
		console.log("Real-time update:", message);
	});

	return <div>Real-time enabled component</div>;
}
```

### Making Payments

```typescript
// Create a payment
const payment = await whopSdk.payments.createPayment({
	userId,
	amount: 10.00,
	currency: "usd",
	description: "Purchase item",
	redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
});
```

## Key Concepts

- **companyId**: Groups experiences under a business entity. Admin access via `checkIfUserHasAccessToCompany`
- **experienceId**: Individual interactive session/room. Access checked via `checkIfUserHasAccessToExperience`
- **Access Levels**: `admin` (full control), `basic` (user access), `no_access` (blocked)
- **JWT Tokens**: Passed in headers, verified with `verifyUserToken`
- **Webhooks**: Must respond 200 quickly, use `waitUntil` for processing

This file contains everything needed to build a Whop app. Copy the code into your project and customize as needed.
