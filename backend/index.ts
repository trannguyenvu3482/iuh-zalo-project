import Fastify from "fastify";
import registerRoutes from "./routes";

const fastify = Fastify({ logger: true });

async function startServer() {
  await registerRoutes(fastify);

  try {
    await fastify.listen({ port: 3000 });
    fastify.log.info(`Server is running on http://localhost:3000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
