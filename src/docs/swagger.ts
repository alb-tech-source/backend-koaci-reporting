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
      url: "http://localhost:8000/",
      description: "Local Server",
    },
    {
      url: "https://backend-koaci-reporting.vercel.app/",
      description: "Deploy Server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication & authorization endpoints" },
    { name: "User", description: "User management endpoints" },
    { name: "Investor", description: "Investor management endpoints" },
    { name: "Investor Document", description: "Investor document endpoints" },
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
      ChangeActivationUserRequest: {
        isActive: true,
      },
      ListUserQuery: {
        page: 1,
        limit: 10,
        search: "john",
        is_active: "true",
      },

      // Investor Schemas
      CreateInvestorRequest: {
        user_id: "uuid-of-existing-user",
        investor_type: "individual",
        status: "inactive",
        gender: "men",
        nik: "1234567890123456",
        address: "Jl. Investor No. 123, Jakarta",
        privy: "privy-id-optional",
        phone: "+6281234567890",
        account_number: "1234567890",
        bank_name: "BCA",
        heir_name: "Jane Heir",
        heir_relationship: "Daughter",
        heir_nik: "9876543210987654",
        heir_address: "Jl. Heir No. 456, Jakarta",
        heir_account_number: "0987654321",
        heir_bank_name: "Mandiri",
        heir_phone: "+6289876543210",
      },

      UpdateInvestorRequest: {
        investor_type: "corporation",
        status: "active",
        gender: "women",
        nik: "1234567890123456",
        address: "Jl. Updated Address No. 789",
        phone: "+6281112223333",
        account_number: "9988776655",
        bank_name: "BNI",
      },

      UpdateInvestorStatusRequest: {
        status: "active",
      },

      ListInvestorQuery: {
        page: 1,
        limit: 10,
        search: "john",
        investor_type: "individual",
        status: "active",
        gender: "men",
      },

      InvestorResponse: {
        investor_id: "uuid-investor-id",
        user_id: "uuid-user-id",
        investor_type: "individual",
        status: "active",
        full_name: "John Doe Investor",
        gender: "men",
        email: "john.investor@example.com",
        nik: "1234567890123456",
        address: "Jl. Investor No. 123, Jakarta",
        privy: "privy-id-optional",
        phone: "+6281234567890",
        account_number: "1234567890",
        bank_name: "BCA",
        heir_name: "Jane Heir",
        heir_relationship: "Daughter",
        heir_nik: "9876543210987654",
        heir_address: "Jl. Heir No. 456, Jakarta",
        heir_account_number: "0987654321",
        heir_bank_name: "Mandiri",
        heir_phone: "+6289876543210",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        user: {
          user_id: "uuid-user-id",
          firstname: "John",
          lastname: "Investor",
          email: "john.investor@example.com",
          is_active: true,
        },
        InvestorDocument: [
          {
            document_id: "uuid-doc-id",
            document_name: "KTP.pdf",
            storage_provider: "cloudflare",
            object_key: "documents/ktp.pdf",
            file_size_bytes: 1024000,
            mime_type: "application/pdf",
            uploaded_at: "2024-01-01T00:00:00.000Z",
          },
        ],
      },

      // Investor Document Schemas
      UploadInvestorDocumentRequest: {
        investor_id: "uuid-investor-id",
        document_name: "KTP.pdf",
        storage_provider: "cloudflare",
        file: "binary-file-data",
      },

      InvestorDocumentResponse: {
        document_id: "uuid-doc-id",
        investor_id: "uuid-investor-id",
        document_name: "KTP.pdf",
        storage_provider: "cloudflare",
        object_key: "investor/uuid/uuid-KTP.pdf",
        file_size_bytes: 1024000,
        mime_type: "application/pdf",
        uploaded_at: "2024-01-01T00:00:00.000Z",
      },

      InvestorDocumentDownloadUrlResponse: {
        downloadUrl: "https://presigned-url-here",
        message: "URL download berhasil dibuat",
      },

      ListInvestorDocumentsResponse: {
        data: [
          {
            document_id: "uuid-doc-id",
            investor_id: "uuid-investor-id",
            document_name: "KTP.pdf",
            storage_provider: "cloudflare",
            object_key: "investor/uuid/uuid-KTP.pdf",
            file_size_bytes: 1024000,
            mime_type: "application/pdf",
            uploaded_at: "2024-01-01T00:00:00.000Z",
          },
        ],
        meta: {
          total: 10,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  },
};

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc);
