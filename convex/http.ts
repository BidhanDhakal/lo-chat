import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { WebhookEvent } from "@clerk/backend";
import { Webhook } from "svix";
import { internal } from "./_generated/api";

const validatePayload = async (req: Request): Promise<WebhookEvent | undefined> => {
    const payload = await req.text()


    const svixHeaders = {
        "svix-id": req.headers.get("svix-id")!,
        "svix-timestamp": req.headers.get("svix-timestamp")!,
        "svix-signature": req.headers.get("svix-signature")!,
    };

    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");
    try {
        const event = webhook.verify(payload, svixHeaders) as WebhookEvent;
        return event;
    } catch (error) {
        console.error("clerk webhook error");
        return;
    }
}

const handleClerkWebhook = httpAction(async (ctx, req) => {
    const event = await validatePayload(req);
    if (!event) {
        return new Response("Webhook verification failed", { status: 400 });
    }

    switch (event.type) {
        case "user.created":
        case "user.updated": {
            console.log(`${event.type} event received for user ${event.data.id}`);


            const existingUser = await ctx.runQuery(internal.user.get, {
                clerkId: event.data.id
            });


            const email = event.data.email_addresses?.[0]?.email_address || "";
            const imageUrl = event.data.image_url || "";
            const firstName = event.data.first_name || "";
            const lastName = event.data.last_name || "";
            const username = `${firstName} ${lastName}`.trim() || event.data.username || "User";

            if (existingUser) {

                console.log(`Updating existing user ${event.data.id} in database`);
                console.log(`- New image URL: ${imageUrl}`);
                console.log(`- New username: ${username}`);


                await ctx.runMutation(internal.user.updateProfile, {
                    userId: existingUser._id,
                    username: username,
                    imageUrl: imageUrl,
                    email: email
                });
            } else {

                console.log(`Creating new user ${event.data.id} in database`);

                await ctx.runMutation(internal.user.crate, {
                    clerkId: event.data.id,
                    email: email,
                    imageUrl: imageUrl,
                    username: username
                });
            }
            break;
        }
        default: {
            console.log("Unhandled event type:", event.type);
        }
    }

    return new Response(null, { status: 200 });
});

const http = httpRouter();

http.route({
    path: "/create-users-webhook",
    method: "POST",
    handler: handleClerkWebhook
});

export default http;
