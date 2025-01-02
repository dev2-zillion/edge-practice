import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { parse } from "npm:json2csv";


const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_ANON_KEY") || "",
);



Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const url = new URL(req.url);
    const pageSize = Number(url.searchParams.get("pagesize"));
    const offset = Number(url.searchParams.get("offset"));

   
    if (!pageSize || !offset) {
      return new Response(
        JSON.stringify({ error: "pageSize and offset are required and must be valid numbers." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const { data } = await supabase
    .from('users')
    .select('*')
    .range(offset, offset + pageSize - 1);
    const csv = parse(data);
    
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=data.csv",
      },
    });

  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ error: "An internal server error occurred." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
