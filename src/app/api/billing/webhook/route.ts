import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { updateProfileBilling } from "@/lib/billing/sync-profile";
import { planFromStripeSubscriptionStatus } from "@/lib/billing/stripe-plan";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServer } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

function subscriptionUserId(sub: Stripe.Subscription): string | null {
  const m = sub.metadata?.supabase_user_id;
  return typeof m === "string" && m.length > 0 ? m : null;
}

/** Stripe typings omit `current_period_end` on some SDK shapes; read defensively. */
function subscriptionPeriodEndIso(sub: Stripe.Subscription): string {
  const cpe = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  if (typeof cpe !== "number") {
    throw new Error("Stripe subscription missing current_period_end");
  }
  return new Date(cpe * 1000).toISOString();
}

async function resolveUserIdForSubscription(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  sub: Stripe.Subscription,
): Promise<string | null> {
  const fromMeta = subscriptionUserId(sub);
  if (fromMeta) return fromMeta;
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  return data && typeof (data as { id?: string }).id === "string"
    ? (data as { id: string }).id
    : null;
}

/**
 * POST /api/billing/webhook
 * Événements Stripe (signature `STRIPE_WEBHOOK_SECRET`) · met à jour `profiles` via service role.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "STRIPE_WEBHOOK_SECRET manquant" },
      { status: 503 },
    );
  }

  const stripe = getStripeServer();
  const admin = createSupabaseAdminClient();
  if (!stripe || !admin) {
    return NextResponse.json(
      { ok: false, error: "Stripe ou Supabase admin non configuré" },
      { status: 503 },
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { ok: false, error: "Missing stripe-signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid_payload";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId =
          (typeof session.metadata?.supabase_user_id === "string" &&
            session.metadata.supabase_user_id) ||
          (typeof session.client_reference_id === "string" &&
            session.client_reference_id) ||
          null;
        if (!userId) break;

        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription && typeof session.subscription === "object"
              ? session.subscription.id
              : null;
        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId);
        const customerId =
          typeof sub.customer === "string"
            ? sub.customer
            : sub.customer && "id" in sub.customer
              ? sub.customer.id
              : null;
        const periodEnd = subscriptionPeriodEndIso(sub);

        await updateProfileBilling(admin, userId, {
          billing_plan: planFromStripeSubscriptionStatus(sub.status),
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          billing_current_period_end: periodEnd,
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdForSubscription(admin, sub);
        if (!userId) break;

        if (event.type === "customer.subscription.deleted") {
          await updateProfileBilling(admin, userId, {
            billing_plan: "free",
            stripe_subscription_id: null,
            billing_current_period_end: null,
          });
          break;
        }

        const customerId =
          typeof sub.customer === "string"
            ? sub.customer
            : sub.customer && "id" in sub.customer
              ? sub.customer.id
              : null;
        const periodEnd = subscriptionPeriodEndIso(sub);
        await updateProfileBilling(admin, userId, {
          billing_plan: planFromStripeSubscriptionStatus(sub.status),
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          billing_current_period_end: periodEnd,
        });
        break;
      }
      default:
        break;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "webhook_handler_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
