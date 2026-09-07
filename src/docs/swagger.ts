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
    { name: "Company", description: "Company management endpoints" },
    { name: "Company Document", description: "Company document endpoints" },
    { name: "Project", description: "Project management endpoints" },
    { name: "Project Document", description: "Project document endpoints" },
    { name: "Project Investment", description: "Project investment endpoints" },
    { name: "Receipt Document", description: "Receipt document endpoints" },
  ],

  components: {
    securitySchemes: {
      // Autentikasi via httpOnly cookie yang di-set saat login / refresh
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "access_token",
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
      SendEmailVerification: {
        email: "user@example.com",
      },
      ResetPasswordRequest: {
        token: "reset_token_here",
        newPassword: "NewPassword123",
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
        role_name: "admin",
        permission_ids: ["uuid-permission-1", "uuid-permission-2", "uuid-permission-3"],
      },
      UpdateGoogleUserRequest: {
        is_active: true,
        role_name: "investor",
        permission_ids: ["uuid-permission-1", "uuid-permission-2"],
      },
      AdminElevationForbiddenResponse: {
        success: false,
        message: "Role admin tidak memiliki izin untuk mengubah user menjadi role superadmin. Hubungi superadmin untuk perubahan ini."
      },
      GoogleUserPasswordResetForbidden: {
        success: false,
        message: "User yang login melalui Google tidak dapat mereset password. Silakan login menggunakan Google OAuth."
      },
      UpdateUserResponse: {
        success: true,
        message: "User berhasil diupdate",
        requiresEmailVerification: false,
        data: {
          user: {
            user_id: "uuid-user-id",
            firstname: "Jane",
            lastname: "Doe",
            email: "jane.doe@example.com",
            is_active: true,
            email_verified: false,
            role: {
              role_id: "uuid-role-id",
              role_name: "admin"
            }
          }
        }
      },
      UpdateUserEmailChangedResponse: {
        success: true,
        message: "Email telah diubah. User perlu memverifikasi email baru melalui endpoint /api/auth/send-verify-email",
        requiresEmailVerification: true,
        data: {
          user: {
            user_id: "uuid-user-id",
            firstname: "Jane",
            lastname: "Doe",
            email: "jane.new@example.com",
            is_active: true,
            email_verified: false,
            role: {
              role_id: "uuid-role-id",
              role_name: "admin"
            }
          }
        }
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

      // Company Schemas
      CreateCompanyRequest: {
        company_name: "PT Koaci Teknologi Indonesia",
        company_type: "PT",
        industry_sector: "Financial Technology",
        description: "Perusahaan teknologi layanan investasi",
        director_name: "Budi Santoso",
        director_phone: "+6281234567890",
        company_email: "office@koaci.id",
        director_privy: "PRIVY-123456",
        company_address: "Jl. Jenderal Sudirman No. 1, Jakarta",
        website: "https://koaci.id",
        heirs_director_name: "Siti Santoso",
        heirs_director_phone: "+6289876543210",
        heirs_director_address: "Jl. Gatot Subroto No. 2, Jakarta",
        status: "active",
      },
      UpdateCompanyRequest: {
        company_name: "PT Koaci Teknologi Nusantara",
        industry_sector: "Investment Technology",
        director_phone: "+628111222333",
        status: "active",
      },
      CompanyResponse: {
        company_id: "uuid-company-id",
        company_name: "PT Koaci Teknologi Indonesia",
        company_type: "PT",
        industry_sector: "Financial Technology",
        description: "Perusahaan teknologi layanan investasi",
        director_name: "Budi Santoso",
        director_phone: "+6281234567890",
        company_email: "office@koaci.id",
        director_privy: "PRIVY-123456",
        company_address: "Jl. Jenderal Sudirman No. 1, Jakarta",
        website: "https://koaci.id",
        heirs_director_name: "Siti Santoso",
        heirs_director_phone: "+6289876543210",
        heirs_director_address: "Jl. Gatot Subroto No. 2, Jakarta",
        status: "active",
        createdAt: "2026-08-16T00:00:00.000Z",
        updatedAt: "2026-08-16T00:00:00.000Z",
        companyDocument: [],
      },
      ListCompaniesResponse: {
        success: true,
        data: [{ $ref: "#/components/schemas/CompanyResponse" }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },

      // Company Document Schemas
      UploadCompanyDocumentRequest: {
        company_id: "uuid-company-id",
        document_type: "Akta Pendirian",
        document_name: "akta-pendirian.pdf",
        storage_provider: "cloudflare",
        file: "binary-file-data",
      },
      UpdateCompanyDocumentRequest: {
        document_type: "Akta Perubahan",
        document_name: "akta-perubahan.pdf",
      },
      CompanyDocumentResponse: {
        document_id: "uuid-document-id",
        company_id: "uuid-company-id",
        document_type: "Akta Pendirian",
        document_name: "akta-pendirian.pdf",
        storage_provider: "cloudflare",
        object_key: "company/uuid-company-id/uuid-akta-pendirian.pdf",
        file_size_bytes: "1024000",
        mime_type: "application/pdf",
        uploaded_by: "uuid-user-id",
        uploaded_at: "2026-08-16T00:00:00.000Z",
        user: {
          user_id: "uuid-user-id",
          firstname: "Admin",
          lastname: "Koaci",
          email: "admin@koaci.id",
        },
      },
      ListCompanyDocumentsResponse: {
        success: true,
        data: [{ $ref: "#/components/schemas/CompanyDocumentResponse" }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
      CompanyDocumentDownloadUrlResponse: {
        success: true,
        data: {
          downloadUrl: "https://presigned-url-here",
          message: "URL download berhasil dibuat",
        },
      },

      // Project Schemas
      CreateProjectRequest: {
        company_id: "uuid-company-id",
        project_key: "proyek-koaci-2026-01",
        funding_required: 500000000,
        net_margin_amount: 75000000,
        applicant_profit_share_percentage: 40,
        applicant_profit_share_amount: 30000000,
        koaci_profit_share_percentage: 20,
        koaci_profit_share_amount: 15000000,
        koaci_profit_share_beneficiary_percentage: 5,
        koaci_profit_share_beneficiary_amount: 3750000,
        investor_profit_share_percentage: 40,
        investor_profit_share_amount: 30000000,
        aggregate_fund_amount: 500000000,
        disbursement_amount: 500000000,
        disbursement_date: "2026-08-30T00:00:00.000Z",
        source_account_number: "1234567890",
        destination_account_number: "0987654321",
        beneficiary_refund_date: "2027-08-30T00:00:00.000Z",
        beneficiary_refund_amount: 575000000,
        beneficiary_repayment_source_account: "0987654321",
        beneficiary_repayment_destination_account: "1234567890",
        url_transaction_folder: "https://drive.google.com/folder/xyz",
        fund_disbursement_official_record: "Berita acara penyaluran dana proyek Koaci 2026-01",
        status: "open",
      },
      UpdateProjectRequest: {
        funding_required: 600000000,
        status: "target_achieved",
      },
      ProjectResponse: {
        project_id: "uuid-project-id",
        project_key: "proyek-koaci-2026-01",
        company_id: "uuid-company-id",
        funding_required: "500000000",
        net_margin_amount: "75000000",
        applicant_profit_share_percentage: 40,
        applicant_profit_share_amount: "30000000",
        koaci_profit_share_percentage: 20,
        koaci_profit_share_amount: "15000000",
        koaci_profit_share_beneficiary_percentage: 5,
        koaci_profit_share_beneficiary_amount: "3750000",
        investor_profit_share_percentage: 40,
        investor_profit_share_amount: "30000000",
        aggregate_fund_amount: "500000000",
        disbursement_amount: "500000000",
        disbursement_date: "2026-08-30T00:00:00.000Z",
        source_account_number: "1234567890",
        destination_account_number: "0987654321",
        beneficiary_refund_date: "2027-08-30T00:00:00.000Z",
        beneficiary_refund_amount: "575000000",
        beneficiary_repayment_source_account: "0987654321",
        beneficiary_repayment_destination_account: "1234567890",
        url_transaction_folder: "https://drive.google.com/folder/xyz",
        fund_disbursement_official_record: "Berita acara penyaluran dana proyek Koaci 2026-01",
        status: "open",
        createdAt: "2026-08-30T00:00:00.000Z",
        updatedAt: "2026-08-30T00:00:00.000Z",
        company: { $ref: "#/components/schemas/CompanyResponse" },
        projectDocument: [],
      },
      ListProjectsResponse: {
        success: true,
        data: [{ $ref: "#/components/schemas/ProjectResponse" }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },

      // Project Document Schemas
      UploadProjectDocumentRequest: {
        project_id: "uuid-project-id",
        document_type: "laporan_keuangan",
        document_name: "laporan-keuangan-q1.pdf",
        storage_provider: "cloudflare",
        file: "binary-file-data",
      },
      UpdateProjectDocumentRequest: {
        document_type: "proposal",
        document_name: "proposal-revisi.pdf",
      },
      ProjectDocumentResponse: {
        document_id: "uuid-document-id",
        project_id: "uuid-project-id",
        document_type: "laporan_keuangan",
        document_name: "laporan-keuangan-q1.pdf",
        storage_provider: "cloudflare",
        object_key: "project/uuid-project-id/uuid-laporan-keuangan-q1.pdf",
        file_size_bytes: "1024000",
        mime_type: "application/pdf",
        uploaded_by: "uuid-user-id",
        uploaded_at: "2026-08-30T00:00:00.000Z",
        user: {
          user_id: "uuid-user-id",
          firstname: "Admin",
          lastname: "Koaci",
          email: "admin@koaci.id",
        },
      },
      ListProjectDocumentsResponse: {
        success: true,
        data: [{ $ref: "#/components/schemas/ProjectDocumentResponse" }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
      ProjectDocumentDownloadUrlResponse: {
        success: true,
        data: {
          downloadUrl: "https://presigned-url-here",
          message: "URL download berhasil dibuat",
        },
      },

      // Project Investment Schemas
      CreateProjectInvestmentRequest: {
        project_id: "uuid-project-id",
        investor_id: "uuid-investor-id",
        amount: 5000000,
        total_package: 10,
        source_account_transaction: "TRX-2026-001",
        account_reference: "REF-2026-001",
        receipt_number: "RCP-2026-001",
        payment_method: "transfer",
        destination_account_number: "1234567890",
      },
      UpdateProjectInvestmentRequest: {
        amount: 7500000,
        payment_method: "cash",
      },
      ProjectInvestmentResponse: {
        project_investment_id: "uuid-investment-id",
        project_id: "uuid-project-id",
        investor_id: "uuid-investor-id",
        amount: "5000000",
        total_package: 10,
        source_account_transaction: "TRX-2026-001",
        account_reference: "REF-2026-001",
        receipt_number: "RCP-2026-001",
        payment_method: "transfer",
        destination_account_number: "1234567890",
        createdAt: "2026-09-05T00:00:00.000Z",
        updatedAt: "2026-09-05T00:00:00.000Z",
        project: { $ref: "#/components/schemas/ProjectResponse" },
        investor: { $ref: "#/components/schemas/InvestorResponse" },
      },
      ListProjectInvestmentsResponse: {
        success: true,
        data: [{ $ref: "#/components/schemas/ProjectInvestmentResponse" }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },

      // Receipt Document Schemas
      ReceiptDocumentResponse: {
        receipt_document_id: "uuid-receipt-id",
        project_investment_id: "uuid-investment-id",
        receipt_name: "kwitansi-investasi.pdf",
        storage_provider: "cloudflare",
        object_key: "receipt/uuid-investment-id/uuid-kwitansi-investasi.pdf",
        file_size_bytes: "1024000",
        mime_type: "application/pdf",
        uploaded_by: "uuid-user-id",
        uploaded_at: "2026-09-05T00:00:00.000Z",
        user: {
          user_id: "uuid-user-id",
          firstname: "Admin",
          lastname: "Koaci",
          email: "admin@koaci.id",
        },
      },
      ReceiptDocumentDownloadUrlResponse: {
        success: true,
        data: {
          downloadUrl: "https://presigned-url-here",
          message: "URL download berhasil dibuat",
        },
      },
    },
  },
};

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc);
