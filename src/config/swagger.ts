import swaggerAutogen from "swagger-autogen";
import { env } from "./env.js";

const doc = {
  info: {
    version: "v1.0.0",
    title: "LexBridge API",
    description:
      "LexBridge is a seamless platform that connects clients with verified legal experts, offering secure communication, easy appointment booking, transparent pricing, and comprehensive legal services all in one place.",
  },
  host: `localhost:${env.PORT || 8000}`,
  basePath: "/",
  schemes: ["http", "https"],
};

const outputFile = "./doc/swagger-output.json";
const endpointsFiles = ["../routes/swagger.route.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
