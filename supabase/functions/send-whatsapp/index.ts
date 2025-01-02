import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const META_API_URL =
  "https://crmapi.automatebusiness.com/whatsapp/waba/v1/messages"; 
const ACCESS_TOKEN = "647f25c64d53b05ab3b32b45";


async function sendWhatsAppMessage(to: string, message: string) {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${ACCESS_TOKEN}`);
  headers.set("Content-Type", "application/json");

  const body = JSON.stringify({
    messaging_product: "whatsapp",
    to: to,
    text: { body: message },
  });

  const response = await fetch(META_API_URL, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send message: ${error}`);
  }

  return await response.json();
}


Deno.serve(async (req) => {
  try {
    const { record } = await req.json(); // Parse the request body
    console.log(record); // Log the record for debugging

    // Ensure that required fields are present
    if (!record || !record.phone || !record.fullName) {
      throw new Error("Missing required 'phone' or 'fullName' fields in payload.");
    }

    // Destructure phone and fullName from record
    const { phone, fullName } = record;
    console.log(phone, fullName); // Log the phone number and full name

    // Send the WhatsApp message
    await sendWhatsAppMessage(
      phone,
      `Hi ${fullName}, Thank you for signing up!`
    );

    // Return success response
    return new Response(
      JSON.stringify({ message: "Message sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);

    // Return error response
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
