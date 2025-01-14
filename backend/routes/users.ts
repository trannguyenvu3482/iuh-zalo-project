import type { FastifyInstance } from "fastify";

export default async function usersRoutes(fastify: FastifyInstance) {
  fastify.get("/api/users", async (request, reply) => {
    // Logic to fetch users
    return { message: "Fetch all users" };
  });

  fastify.post("/api/users", async (request, reply) => {
    // Logic to create a new user
    return { message: "User created" };
  });
}
