import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@^14.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
    const signature = req.headers.get("stripe-signature");

    if (!signature || !endpointSecret) {
        return new Response("Missing signature or webhook secret", { status: 400 });
    }

    try {
        const body = await req.text();
        const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            const userId = session.client_reference_id;
            if (!userId) {
                console.error("No client_reference_id found");
                return new Response("Ok", { status: 200 });
            }

            await supabaseAdmin.from("orders").insert({
                user_id: userId,
                stripe_session_id: session.id,
                stripe_subscription_id: session.subscription as string,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                status: session.payment_status,
            });

            await supabaseAdmin
                .from("profiles")
                .update({
                    payment_status: "pago",
                    is_active: true,
                })
                .eq("user_id", userId);
        }

        if (event.type === 'invoice.paid') {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("user_id")
                .eq("stripe_customer_id", customerId)
                .single();

            if (profile) {
                await supabaseAdmin
                    .from("profiles")
                    .update({
                        payment_status: "pago",
                        is_active: true,
                    })
                    .eq("user_id", profile.user_id);
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
});
