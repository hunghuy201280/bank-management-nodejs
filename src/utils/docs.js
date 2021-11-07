import swaggerJsDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Bank Management API",
      version: "1.0.0",
      description: "API documentation for Bank Management App",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  apis: ["./src/models/*.js", "./src/routers/*.js"],
};
export const specs = swaggerJsDoc(options);
