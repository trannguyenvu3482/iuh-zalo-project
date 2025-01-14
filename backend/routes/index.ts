import type { FastifyInstance } from "fastify";
import authRoutes from "./auth";
import usersRoutes from "./users";

export default async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(usersRoutes);
  await fastify.register(authRoutes);
}
