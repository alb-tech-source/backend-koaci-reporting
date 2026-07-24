import swaggerAutogen from "swagger-autogen";

const outputFile = "./swagger_output.json";

const endpointsFiles = ["../routes/index.route.ts"];

const doc = {
  info: {
    version: "v0.0.1",
    title: "",
    description: "",
  },
  servers: [
    {
      url: "http://localhost:8000/api",
      description: "Local Server",
    },
    {
      url: "https://backend-koaci-reporting.vercel.app/",
      description: "Deploy Server",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },

    schemas: {
      LoginRequest: {
        email: "admin@koaci.id",
        password: "password123",
      },
      RegisterRequest: {
        firstname: "John",
        lastname: "Doe",
        email: "john.doe@example.com",
        password: "Password123",
      },
      ForgotPasswordRequest: {
        email: "user@example.com",
      },
      ResetPasswordRequest: {
        token: "reset_token_here",
        newPassword: "NewPassword123",
      },
      RefreshTokenRequest: {
        refreshToken: "your_refresh_token_here",
      },
      CreateUserRequest: {
        firstname: "Jane",
        lastname: "Smith",
        email: "jane.smith@example.com",
        password: "Password123",
        is_active: true,
        role_name: "admin",
        permission_ids: ["uuid-permission-1", "uuid-permission-2"],
      },
      UpdateUserRequest: {
        firstname: "Jane",
        lastname: "Doe",
        email: "jane.doe@example.com",
        password: "NewPassword123",
        is_active: true,
      },
      ListUserQuery: {
        page: 1,
        limit: 10,
        search: "john",
        is_active: "true",
      },
    },
  },
};

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc);
