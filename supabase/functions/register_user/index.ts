import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { hash } from "https://deno.land/x/bcrypt/mod.ts";
import { sendEmail } from "../shared/sendEmail.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_ANON_KEY") || "",
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const { fullName, email, userName, password, phoneNumber } = await req.json();
    if (
      [fullName, email, userName, password].some((field) =>
        !field || field.trim() === ""
      )
    ) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({
          error: "Password must be at least 8 characters long.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    console.log("payload", fullName, email, userName, password);

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},userName.eq.${userName}`)
      .single();

    console.log("existingUser", existingUser);

    if (existingUser) {
      return new Response(
        JSON.stringify({
          error: "A user with this email or username already exists!",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }

    const { data, error: insertError } = await supabase
      .from("users")
      .insert([{ fullName, email, userName, password }]).select();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log("Inserted Data:", data);
    return new Response(
      JSON.stringify({ message: "User registered successfully!", user: data }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ error: "Invalid request payload." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
