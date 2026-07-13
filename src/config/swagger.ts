import swaggerJsdoc from "swagger-jsdoc";

const getServerUrl = () => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const vercelUrl = process.env.VERCEL_URL;

  if (nodeEnv === "production" && vercelUrl) {
    return `https://${vercelUrl}`;
  } else if (nodeEnv === "production") {
    return "https://backend-koaci-reporting.vercel.app";
  } else {
    return `http://localhost:${process.env.PORT || "8000"}`;
  }
};

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Koaci Reporting App API",
      version: "1.0.0",
      description:
        "API documentation for Koaci Reporting App Backend with Role-Based Access Control (RBAC)",
      contact: {
        name: "API Support",
        email: "support@koaci.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: getServerUrl(),
        description: process.env.NODE_ENV === "production" ? "Production server" : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
      },
      schemas: {
        // Auth Schemas
        RegisterInput: {
          type: "object",
          required: ["firstname", "lastname", "email", "password"],
          properties: {
            firstname: {
              type: "string",
              minLength: 1,
              maxLength: 50,
              description: "First name of the user",
              example: "John",
            },
            lastname: {
              type: "string",
              minLength: 1,
              maxLength: 50,
              description: "Last name of the user",
              example: "Doe",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
              example: "john.doe@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              description:
                "User's password (min 8 chars, must contain uppercase and number)",
              example: "SecurePass123",
            },
          },
          example: {
            firstname: "John",
            lastname: "Doe",
            email: "john.doe@example.com",
            password: "SecurePass123",
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
              example: "admin@koaci.com",
            },
            password: {
              type: "string",
              description: "User's password",
              example: "22ab733071f9",
            },
          },
          example: {
            email: "admin@koaci.com",
            password: "22ab733071f9",
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              description: "JWT access token (expires in 1 hour)",
              example:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiaWF0IjoxNjg5MTIzNDU2LCJleHAiOjE2ODkxMjcwNjZ9.qO6L4qQX9L-3sVJKZVGJVGJYVJMqJHJKVVFGJqJHJJV",
            },
            refreshToken: {
              type: "string",
              description: "JWT refresh token (expires in 7 days)",
              example:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiaWF0IjoxNjg5MTIzNDU2LCJleHAiOjE2ODk3MjgyNTZ9.qO6L4qQX9L-3sVJKZVGJVGJYVJMqJHJKVVFGJqJHJJV",
            },
          },
          example: {
            accessToken:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiaWF0IjoxNjg5MTIzNDU2LCJleHAiOjE2ODkxMjcwNjZ9.qO6L4qQX9L-3sVJKZVGJVGJYVJMqJHJKVVFGJqJHJJV",
            refreshToken:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiaWF0IjoxNjg5MTIzNDU2LCJleHAiOjE2ODk3MjgyNTZ9.qO6L4qQX9L-3sVJKZVGJVGJYVJMqJHJKVVFGJqJHJJV",
          },
        },
        SafeUser: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              format: "uuid",
              description: "Unique user identifier",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            firstname: {
              type: "string",
              nullable: true,
              description: "User's first name",
              example: "John",
            },
            lastname: {
              type: "string",
              nullable: true,
              description: "User's last name",
              example: "Doe",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
              example: "john.doe@example.com",
            },
            is_active: {
              type: "boolean",
              description: "User account active status",
              example: true,
            },
            last_login_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              description: "Last login timestamp",
              example: "2026-07-13T10:30:00.000Z",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
              example: "2026-01-15T08:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
              example: "2026-07-13T09:45:00.000Z",
            },
          },
          example: {
            user_id: "123e4567-e89b-12d3-a456-426614174000",
            firstname: "John",
            lastname: "Doe",
            email: "john.doe@example.com",
            is_active: true,
            last_login_at: "2026-07-13T10:30:00.000Z",
            createdAt: "2026-01-15T08:00:00.000Z",
            updatedAt: "2026-07-13T09:45:00.000Z",
          },
        },
        // User Management Schemas
        CreateUserInput: {
          type: "object",
          required: ["firstname", "lastname", "email"],
          properties: {
            firstname: {
              type: "string",
              minLength: 1,
              maxLength: 50,
              description: "First name of the user",
              example: "Jane",
            },
            lastname: {
              type: "string",
              minLength: 1,
              maxLength: 50,
              description: "Last name of the user",
              example: "Smith",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
              example: "jane.smith@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              description:
                "Optional - if not provided, system will generate temporary password",
              example: "SecurePass123",
            },
            is_active: {
              type: "boolean",
              description: "Account active status (default: false)",
              example: false,
            },
          },
          example: {
            firstname: "Jane",
            lastname: "Smith",
            email: "jane.smith@example.com",
            password: "SecurePass123",
            is_active: false,
          },
        },
        UpdateUserInput: {
          type: "object",
          properties: {
            firstname: {
              type: "string",
              minLength: 1,
              maxLength: 50,
              description: "First name of the user",
              example: "Jane",
            },
            lastname: {
              type: "string",
              minLength: 1,
              maxLength: 50,
              description: "Last name of the user",
              example: "Smith",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
              example: "jane.smith@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              description: "New password for the user",
              example: "NewPassword123",
            },
            is_active: {
              type: "boolean",
              description: "Account active status",
              example: true,
            },
          },
          example: {
            firstname: "Jane",
            lastname: "Smith",
            email: "jane.smith@example.com",
            is_active: true,
          },
        },
        ListUserQuery: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              minimum: 1,
              default: 1,
              description: "Page number for pagination",
              example: 1,
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 10,
              description: "Number of items per page",
              example: 10,
            },
            search: {
              type: "string",
              description: "Search by firstname, lastname, or email",
              example: "john",
            },
            is_active: {
              type: "boolean",
              description: "Filter by active status",
              example: true,
            },
          },
          example: {
            page: 1,
            limit: 10,
            search: "john",
            is_active: true,
          },
        },
        PaginatedResult: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/SafeUser",
              },
            },
            meta: {
              type: "object",
              properties: {
                total: {
                  type: "integer",
                  description: "Total number of items",
                  example: 50,
                },
                page: {
                  type: "integer",
                  description: "Current page number",
                  example: 1,
                },
                limit: {
                  type: "integer",
                  description: "Items per page",
                  example: 10,
                },
                totalPages: {
                  type: "integer",
                  description: "Total number of pages",
                  example: 5,
                },
              },
            },
          },
          example: {
            data: [
              {
                user_id: "123e4567-e89b-12d3-a456-426614174000",
                firstname: "John",
                lastname: "Doe",
                email: "john.doe@example.com",
                is_active: true,
                last_login_at: "2026-07-13T10:30:00.000Z",
                createdAt: "2026-01-15T08:00:00.000Z",
                updatedAt: "2026-07-13T09:45:00.000Z",
              },
            ],
            meta: {
              total: 50,
              page: 1,
              limit: 10,
              totalPages: 5,
            },
          },
        },
        // Error Schemas
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message describing what went wrong",
              example: "Email sudah terdaftar",
            },
          },
          example: {
            success: false,
            message: "Email sudah terdaftar",
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Indicates if the request was successful",
              example: false,
            },
            message: {
              type: "string",
              description:
                "Validation error message (may contain multiple errors separated by periods)",
              example: "Firstname wajib diisi., Email format tidak valid",
            },
          },
          example: {
            success: false,
            message: "Firstname wajib diisi., Email format tidak valid",
          },
        },
        // Complete Response Schemas
        RegisterSuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example:
                "Registrasi berhasil. Silakan hubungi admin untuk aktivasi akun.",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/SafeUser",
                },
              },
            },
          },
          example: {
            success: true,
            message:
              "Registrasi berhasil. Silakan hubungi admin untuk aktivasi akun.",
            data: {
              user: {
                user_id: "123e4567-e89b-12d3-a456-426614174000",
                firstname: "John",
                lastname: "Doe",
                email: "john.doe@example.com",
                is_active: false,
                last_login_at: null,
                createdAt: "2026-07-13T10:30:00.000Z",
                updatedAt: "2026-07-13T10:30:00.000Z",
              },
            },
          },
        },
        LoginSuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Login berhasil",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/SafeUser",
                },
                tokens: {
                  $ref: "#/components/schemas/AuthTokens",
                },
              },
            },
          },
          example: {
            success: true,
            message: "Login berhasil",
            data: {
              user: {
                user_id: "123e4567-e89b-12d3-a456-426614174000",
                firstname: "Admin",
                lastname: "User",
                email: "admin@koaci.com",
                is_active: true,
                last_login_at: "2026-07-13T10:30:00.000Z",
                createdAt: "2026-01-15T08:00:00.000Z",
                updatedAt: "2026-07-13T10:30:00.000Z",
              },
              tokens: {
                accessToken:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiaWF0IjoxNjg5MTIzNDU2LCJleHAiOjE2ODkxMjcwNjZ9.qO6L4qQX9L-3sVJKZVGJVGJYVJMqJHJKVVFGJqJHJJV",
                refreshToken:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiaWF0IjoxNjg5MTIzNDU2LCJleHAiOjE2ODk3MjgyNTZ9.qO6L4qQX9L-3sVJKZVGJVGJYVJMqJHJKVVFGJqJHJJV",
              },
            },
          },
        },
        MeSuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "User profile berhasil diambil",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/SafeUser",
                },
                role: {
                  type: "string",
                  enum: ["bod", "admin", "investor"],
                  example: "admin",
                },
                permissions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
            },
          },
          example: {
            success: true,
            message: "User profile berhasil diambil",
            data: {
              user: {
                user_id: "123e4567-e89b-12d3-a456-426614174000",
                firstname: "Admin",
                lastname: "User",
                email: "admin@koaci.com",
                is_active: true,
                last_login_at: "2026-07-13T10:30:00.000Z",
                createdAt: "2026-01-15T08:00:00.000Z",
                updatedAt: "2026-07-13T10:30:00.000Z",
              },
              role: "admin",
              permissions: [
                "users:read",
                "users:create",
                "users:update",
                "users:delete",
                "reports:read",
                "reports:create",
                "dashboard:view",
              ],
            },
          },
        },
        UserListSuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Success",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/SafeUser",
              },
            },
            meta: {
              type: "object",
              properties: {
                total: {
                  type: "integer",
                  example: 50,
                },
                page: {
                  type: "integer",
                  example: 1,
                },
                limit: {
                  type: "integer",
                  example: 10,
                },
                totalPages: {
                  type: "integer",
                  example: 5,
                },
              },
            },
          },
          example: {
            success: true,
            message: "Success",
            data: [
              {
                user_id: "123e4567-e89b-12d3-a456-426614174000",
                firstname: "John",
                lastname: "Doe",
                email: "john.doe@example.com",
                is_active: true,
                last_login_at: "2026-07-13T10:30:00.000Z",
                createdAt: "2026-01-15T08:00:00.000Z",
                updatedAt: "2026-07-13T09:45:00.000Z",
              },
              {
                user_id: "223e4567-e89b-12d3-a456-426614174001",
                firstname: "Jane",
                lastname: "Smith",
                email: "jane.smith@example.com",
                is_active: true,
                last_login_at: "2026-07-12T15:20:00.000Z",
                createdAt: "2026-02-10T09:00:00.000Z",
                updatedAt: "2026-07-12T15:20:00.000Z",
              },
            ],
            meta: {
              total: 50,
              page: 1,
              limit: 10,
              totalPages: 5,
            },
          },
        },
        CreateUserSuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Success",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/SafeUser",
                },
                temporaryPassword: {
                  type: "string",
                  description: "Temporary password (only shown once)",
                },
              },
            },
          },
          example: {
            success: true,
            message: "Success",
            data: {
              user: {
                user_id: "323e4567-e89b-12d3-a456-426614174002",
                firstname: "Jane",
                lastname: "Smith",
                email: "jane.smith@example.com",
                is_active: false,
                last_login_at: null,
                createdAt: "2026-07-13T11:00:00.000Z",
                updatedAt: "2026-07-13T11:00:00.000Z",
              },
              temporaryPassword: "a1b2c3d4e5f6g7h8",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/modules/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
