export default {
  async fetch(request) {
    const url = new URL(request.url);
    const apiUrl = new URL("https://boracle.app/api/materials");

    // Automatically appends whatever query params the frontend sends (e.g., ?cursor=XYZ)
    apiUrl.search = url.search;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const response = await fetch(apiUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();

      return new Response(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};