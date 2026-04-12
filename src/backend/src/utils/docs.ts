import swaggerJSDoc from "swagger-jsdoc";
import { env } from '../config/env';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VP Planillas API",
      version: "1.0.0",
      description: "API documentation for VP Planillas system.",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
});
