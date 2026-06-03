/**
 * Cloudflare Worker for receiving StudyMatz multipart/form-data submissions
 * and forwarding them to a Discord Webhook.
 */

export default {
  async fetch(request, env) {
    // 1. Setup CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    try {
      // 2. Parse Incoming FormData
      const formData = await request.formData();
      
      const courseCode = formData.get("courseCode") || "Unknown Course";
      const semester = formData.get("semester") || "Unknown Semester";
      const uploaderName = formData.get("uploaderName") || "Anonymous";
      const description = formData.get("description") || "No description provided.";
      const resourceUrl = formData.get("resourceUrl") || "";

      // 3. Prepare Discord Webhook Payload
      const discordWebhookUrl = env.DISCORD_WEBHOOK;
      if (!discordWebhookUrl) {
        throw new Error("Discord webhook URL is not configured.");
      }

      const discordFormData = new FormData();
      
      // Build the Discord Embed Fields
      const embedFields = [
        { name: "Uploader", value: uploaderName, inline: true },
        { name: "Description", value: description, inline: false }
      ];

      // Add Resource URL to embed if it was provided
      if (resourceUrl) {
        embedFields.push({ name: "Resource Link", value: resourceUrl, inline: false });
      }

      const payloadJson = {
        username: "StudyMatz Submissions",
        content: "🔔 **New Study Material Pending Review**",
        embeds: [{
          title: `Course: ${courseCode} | ${semester}`,
          color: 16744448, // Orange
          fields: embedFields,
          timestamp: new Date().toISOString()
        }]
      };

      // Append the text/embed payload
      discordFormData.append("payload_json", JSON.stringify(payloadJson));

      // 4. Extract and Append Files (Discord allows up to 10 files per webhook)
      let fileCount = 0;
      for (const [key, value] of formData.entries()) {
        // Only target the file inputs that actually contain file data
        if (key === "files" && value instanceof File && value.size > 0) {
          discordFormData.append(`files[${fileCount}]`, value, value.name);
          fileCount++;
          
          if (fileCount >= 10) break; // Hard limit for Discord webhooks
        }
      }

      // Final server-side validation to ensure at least a URL or a file was submitted
      if (fileCount === 0 && !resourceUrl) {
         throw new Error("Bad Request: Must provide either a resourceUrl or at least one file.");
      }

      // 5. Fire off to Discord
      const discordResponse = await fetch(discordWebhookUrl, {
        method: "POST",
        body: discordFormData,
      });

      if (!discordResponse.ok) {
        const discordErrorText = await discordResponse.text();
        throw new Error(`Discord API Error (${discordResponse.status}): ${discordErrorText}`);
      }

      // 6. Return Success
      return new Response(JSON.stringify({ success: true, message: "Sent successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};