import type { FastifyInstance } from "fastify";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/api/auth/sign-in", async (request, reply) => {
    // Get data from request
    const { phone }: { phone: string } = request.body as { phone: string };

    console.log(phone);

    // const { data, error } = await supabase.auth.signInWithOtp({
    //   phone,
    // });
    return { message: "Sign in with OTP", phone };
  });

  fastify.post("/api/auth", async (request, reply) => {
    // Logic to create a new user
    return { message: "User created" };
  });
}
