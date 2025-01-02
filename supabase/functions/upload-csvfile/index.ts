import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { parse } from "npm:json2csv";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_ANON_KEY") || "",
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
      });
    }

    const text = await file.text();
console.log(text)
    // Parse CSV text into JSON
    const csvRows = text
      .split("\n")
      .slice(1) // Skip header
      .map((row) => row.split(",")) // Split rows into fields
      .filter((row) => row.length > 1); // Filter out empty rows

    if (csvRows.length === 0) {
      return new Response(JSON.stringify({ error: "CSV is empty or invalid" }), {
        status: 400,
      });
    }

    // Map rows into objects matching your table structure
    const rows = csvRows.map(([name, phone]) => ({
      name: name.trim(),
      phone: phone.trim(),
    }));
console.log(csvRows)
    // Insert data into Supabase
    const { error } = await supabase.from("testing").insert(rows);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ message: "Data uploaded successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "An internal server error occurred." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
