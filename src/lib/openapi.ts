import { OpenAPIV3 } from "openapi-types";

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Drenoday API",
    version: "1.0.0",
    description:
      "API do Drenoday — plataforma de hospedagem e deploy de aplicações.\n\n" +
      "Base URL: `/api/v1`\n\n" +
      "## Autenticação\n\n" +
      "A maioria dos endpoints requer autenticação via **Bearer Token** JWT.\n" +
      "Envie o token no header `Authorization: Bearer <token>`.\n\n" +
      "### Fluxo de autenticação\n" +
      "1. Faça login via `POST /api/v1/auth/login` (ou OAuth: GitHub/Google)\n" +
      "2. Use o JWT retornado nas requisições autenticadas\n\n" +
      "### Deploy Token\n" +
      "O endpoint `POST /api/v1/deploy` usa um token específico do projeto (`deploy_token`)\n" +
      "em vez do JWT do usuário. Esse token é gerado por projeto e pode ser consultado/regenerado\n" +
      "nos endpoints de deploy-token.",
    contact: {
      name: "Suporte Drenoday",
      url: "https://drenoday.enor.tech",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Desenvolvimento",
    },
    {
      url: "https://drenoday.enor.tech",
      description: "Produção",
    },
  ],
  paths: {
    // ───── Health ─────
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Verificar estado da API",
        description: "Endpoint público para verificar se a API está operacional.",
        operationId: "healthCheck",
        responses: {
          "200": {
            description: "API saudável",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: {
                      type: "string",
                      format: "date-time",
                      example: "2025-01-01T00:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ───── Auth ─────
    "/api/v1/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Login com credenciais",
        description:
          "Autentica o utilizador com username e password. Retorna um token JWT " +
          "que deve ser enviado no header `Authorization: Bearer <token>` nas " +
          "requisições autenticadas.",
        operationId: "authLogin",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: {
                    type: "string",
                    minLength: 3,
                    example: "joaosilva",
                    description: "Nome de utilizador",
                  },
                  password: {
                    type: "string",
                    minLength: 6,
                    example: "minhasenha123",
                    description: "Palavra-passe",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login bem-sucedido. Retorna o token JWT.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: {
                      type: "string",
                      example:
                        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                      description: "Token JWT de autenticação",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Credenciais inválidas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Usuário ou senha inválida" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/auth/email": {
      post: {
        tags: ["Autenticação"],
        summary: "Login com email e código de verificação",
        description:
          "Autentica o utilizador usando email e código de verificação.\n\n" +
          "**Nota:** O código deve ser obtido primeiro através do endpoint " +
          "`POST /auth/send-code-verification`.",
        operationId: "authLoginWithEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "utilizador@exemplo.com",
                    description: "Email do utilizador",
                  },
                  code: {
                    type: "string",
                    minLength: 6,
                    maxLength: 6,
                    example: "123456",
                    description: "Código de verificação de 6 dígitos",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login bem-sucedido",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: {
                      type: "string",
                      description: "Token JWT de autenticação",
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Código inválido ou expirado" },
          "404": { description: "Utilizador não encontrado" },
        },
      },
    },

    "/api/v1/auth/send-code-verification": {
      post: {
        tags: ["Autenticação"],
        summary: "Enviar código de verificação por email",
        description:
          "Envia um código de verificação de 6 dígitos para o email do " +
          "utilizador. O código é utilizado no endpoint `POST /auth/verify-code` " +
          "para verificar o email.",
        operationId: "sendCodeVerification",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "utilizador@exemplo.com",
                    description: "Email do utilizador",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Código enviado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Código de verificação enviado para o e-mail.",
                    },
                  },
                },
              },
            },
          },
          "500": { description: "Falha ao enviar o código" },
        },
      },
    },

    "/api/v1/auth/verify-code": {
      post: {
        tags: ["Autenticação"],
        summary: "Verificar código de email",
        description:
          "Verifica o código de 6 dígitos enviado para o email do utilizador.",
        operationId: "verifyCode",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "utilizador@exemplo.com",
                  },
                  code: {
                    type: "string",
                    minLength: 6,
                    maxLength: 6,
                    example: "123456",
                    description: "Código recebido no email",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Email verificado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "E-mail verificado com sucesso.",
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Código de verificação inválido" },
          "404": { description: "Utilizador não encontrado" },
        },
      },
    },

    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Autenticação"],
        summary: "Recuperar palavra-passe",
        description:
          "Envia um token de recuperação de palavra-passe para o email do " +
          "utilizador. O token deve ser usado no endpoint " +
          "`POST /auth/reset-password` para definir uma nova palavra-passe.",
        operationId: "forgotPassword",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "utilizador@exemplo.com",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Token de recuperação enviado (ou confirmação genérica por segurança)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Se o email existir, receberá instruções de recuperação.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Autenticação"],
        summary: "Redefinir palavra-passe",
        description:
          "Redefine a palavra-passe usando o token recebido por email.",
        operationId: "resetPassword",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: {
                    type: "string",
                    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    description: "Token de recuperação recebido por email",
                  },
                  password: {
                    type: "string",
                    minLength: 6,
                    example: "novasenha123",
                    description: "Nova palavra-passe",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Palavra-passe redefinida com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Palavra-passe redefinida com sucesso.",
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Token inválido ou expirado" },
        },
      },
    },

    "/api/v1/auth/github": {
      get: {
        tags: ["Autenticação"],
        summary: "Login com GitHub (OAuth)",
        description:
          "Redireciona o utilizador para o fluxo de autenticação OAuth do GitHub. " +
          "Após autorização, o callback redireciona para o frontend com os cookies " +
          "de autenticação configurados.",
        operationId: "authGitHub",
        responses: {
          "302": { description: "Redirecionamento para o GitHub" },
        },
      },
    },

    "/api/v1/auth/google": {
      get: {
        tags: ["Autenticação"],
        summary: "Login com Google (OAuth)",
        description:
          "Redireciona o utilizador para o fluxo de autenticação OAuth do Google. " +
          "Aceita o parâmetro opcional `?create` para indicar criação de conta.",
        operationId: "authGoogle",
        parameters: [
          {
            name: "create",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Se presente, indica criação de nova conta",
          },
        ],
        responses: {
          "302": { description: "Redirecionamento para o Google" },
        },
      },
    },

    // ───── User ─────
    "/api/v1/user/create": {
      post: {
        tags: ["Utilizador"],
        summary: "Criar conta de utilizador",
        description:
          "Regista um novo utilizador na plataforma. O username é gerado " +
          "automaticamente a partir do nome informado.",
        operationId: "createUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: {
                    type: "string",
                    minLength: 3,
                    example: "João Silva",
                    description: "Nome completo do utilizador",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "joao@exemplo.com",
                  },
                  password: {
                    type: "string",
                    minLength: 6,
                    example: "minhasenha123",
                    description: "Palavra-passe",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Conta criada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "ID do utilizador" },
                    username: { type: "string", description: "Username gerado" },
                    email: { type: "string", description: "Email do utilizador" },
                    name: { type: "string", description: "Nome do utilizador" },
                  },
                },
              },
            },
          },
          "400": { description: "Dados inválidos ou email já registado" },
        },
      },
    },

    "/api/v1/user/me": {
      get: {
        tags: ["Utilizador"],
        summary: "Perfil do utilizador autenticado",
        description:
          "Retorna os dados do perfil do utilizador atualmente autenticado.",
        operationId: "getMe",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Dados do perfil",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    username: { type: "string" },
                    email: { type: "string", format: "email" },
                    name: { type: "string" },
                    avatar_url: { type: "string", nullable: true },
                    github_username: { type: "string", nullable: true },
                    is_active: { type: "boolean" },
                    roleUser: { type: "string" },
                    provider: { type: "string" },
                    created_at: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "401": { description: "Não autenticado" },
        },
      },
    },

    "/api/v1/user/all": {
      get: {
        tags: ["Utilizador"],
        summary: "Listar todos os utilizadores",
        description:
          "Retorna uma lista paginada de todos os utilizadores registados.",
        operationId: "getAllUsers",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
            description: "Número da página",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
            description: "Quantidade por página",
          },
          {
            name: "username",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filtrar por username",
          },
        ],
        responses: {
          "200": {
            description: "Lista de utilizadores",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          username: { type: "string" },
                          email: { type: "string" },
                          name: { type: "string" },
                        },
                      },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    perPage: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/user/each/{userId}": {
      get: {
        tags: ["Utilizador"],
        summary: "Buscar utilizador por ID",
        description: "Retorna os dados de um utilizador específico.",
        operationId: "getUser",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID do utilizador",
          },
        ],
        responses: {
          "200": {
            description: "Dados do utilizador",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    username: { type: "string" },
                    email: { type: "string" },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          "404": { description: "Utilizador não encontrado" },
        },
      },
    },

    "/api/v1/user/update": {
      put: {
        tags: ["Utilizador"],
        summary: "Atualizar perfil",
        description: "Atualiza os dados do perfil do utilizador autenticado.",
        operationId: "updateUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    minLength: 3,
                    description: "Novo nome",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    description: "Novo email",
                  },
                  password: {
                    type: "string",
                    minLength: 6,
                    description: "Nova palavra-passe",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Perfil atualizado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Perfil atualizado com sucesso." },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ───── GitHub ─────
    "/api/v1/github/list/repo": {
      get: {
        tags: ["GitHub"],
        summary: "Listar repositórios do GitHub",
        description:
          "Retorna a lista de repositórios do GitHub do utilizador autenticado.",
        operationId: "getUserRepos",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
          {
            name: "name",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filtrar por nome do repositório",
          },
        ],
        responses: {
          "200": {
            description: "Lista de repositórios",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer" },
                      name: { type: "string" },
                      full_name: { type: "string" },
                      html_url: { type: "string" },
                      description: { type: "string", nullable: true },
                      private: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/github/list/repo/{name}": {
      get: {
        tags: ["GitHub"],
        summary: "Listar repositórios por nome",
        description: "Pesquisa repositórios do GitHub por nome.",
        operationId: "getUserReposByName",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Nome a pesquisar",
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          "200": { description: "Repositórios encontrados" },
        },
      },
    },

    "/api/v1/github/list/repo/{owner}/{repo}": {
      get: {
        tags: ["GitHub"],
        summary: "Obter repositório específico",
        description: "Retorna os detalhes de um repositório específico do GitHub.",
        operationId: "getRepoByName",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "owner",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Dono do repositório",
          },
          {
            name: "repo",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Nome do repositório",
          },
        ],
        responses: {
          "200": { description: "Detalhes do repositório" },
        },
      },
    },

    "/api/v1/github/list/branches/{owner}/{repo}": {
      get: {
        tags: ["GitHub"],
        summary: "Listar branches de um repositório",
        description: "Retorna as branches de um repositório específico.",
        operationId: "getRepoBranches",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "owner",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "repo",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
          {
            name: "name",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filtrar branches por nome",
          },
        ],
        responses: {
          "200": { description: "Lista de branches" },
        },
      },
    },

    "/api/v1/github/sync": {
      put: {
        tags: ["GitHub"],
        summary: "Sincronizar conta GitHub",
        description:
          "Associa a conta do GitHub ao perfil do utilizador na plataforma.",
        operationId: "syncGitHub",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["github_username", "github_token", "github_user_id"],
                properties: {
                  github_username: {
                    type: "string",
                    example: "joaosilva",
                  },
                  github_token: {
                    type: "string",
                    description: "Token de acesso pessoal do GitHub",
                  },
                  github_user_id: {
                    type: "string",
                    description: "ID do utilizador no GitHub",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Conta GitHub sincronizada com sucesso",
          },
        },
      },
    },

    "/api/v1/github/unsync": {
      post: {
        tags: ["GitHub"],
        summary: "Remover ligação com GitHub",
        description: "Desassocia a conta do GitHub do perfil do utilizador.",
        operationId: "unsyncGitHub",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Conta GitHub removida com sucesso",
          },
        },
      },
    },

    // ───── Project ─────
    "/api/v1/project/create": {
      post: {
        tags: ["Projeto"],
        summary: "Criar novo projeto",
        description:
          "Cria um novo projeto de hospedagem. O subdomínio é gerado automaticamente " +
          "a partir do nome. Valida o repositório GitHub e calcula o valor do plano.",
        operationId: "createProject",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "name",
                  "description",
                  "branch",
                  "port",
                  "repo_url",
                  "default_plan",
                ],
                properties: {
                  name: {
                    type: "string",
                    minLength: 3,
                    description: "Nome do projeto",
                    example: "Meu App",
                  },
                  description: {
                    type: "string",
                    minLength: 10,
                    description: "Descrição do projeto",
                    example: "Aplicação web para gestão de tarefas",
                  },
                  branch: {
                    type: "string",
                    minLength: 3,
                    description: "Branch do repositório para deploy",
                    example: "main",
                  },
                  port: {
                    type: "integer",
                    minimum: 1,
                    description: "Porta da aplicação",
                    example: 3000,
                  },
                  repo_url: {
                    type: "string",
                    format: "uri",
                    description: "URL do repositório GitHub",
                    example: "https://github.com/joaosilva/meu-app",
                  },
                  default_plan: {
                    type: "string",
                    minLength: 3,
                    description: "ID ou nome do plano",
                    example: "basic",
                  },
                  period_duration: {
                    type: "integer",
                    minimum: 1,
                    description: "Duração do período em meses",
                    example: 1,
                  },
                  default_type_payment: {
                    type: "string",
                    description: "Tipo de pagamento padrão",
                    enum: ["monthly", "trimestral", "semestral", "yearly"],
                  },
                  environments: {
                    type: "array",
                    description: "Variáveis de ambiente iniciais",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string" },
                        value: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Projeto criado com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    subdomain: { type: "string" },
                    repo_url: { type: "string" },
                    branch: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "Dados inválidos ou repositório não verificado" },
        },
      },
    },

    "/api/v1/project/each/{projectId}": {
      get: {
        tags: ["Projeto"],
        summary: "Obter detalhes do projeto",
        description:
          "Retorna os detalhes de um projeto específico, incluindo informações " +
          "do deploy mais recente, estado de pagamento e último commit.",
        operationId: "getProject",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "ID do projeto",
          },
        ],
        responses: {
          "200": {
            description: "Detalhes do projeto",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    subdomain: { type: "string" },
                    repo_url: { type: "string" },
                    branch: { type: "string" },
                    port: { type: "integer" },
                    description: { type: "string" },
                    paid: { type: "boolean" },
                    date_expire: { type: "string", format: "date-time", nullable: true },
                    deploy: {
                      type: "object",
                      properties: {
                        commit_msg: { type: "string" },
                        commit_branch: { type: "string" },
                        commit_author: { type: "string" },
                        status: { type: "string" },
                        commit_avatar_url: { type: "string", nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          "403": { description: "Sem permissão para aceder ao projeto" },
          "404": { description: "Projeto não encontrado" },
        },
      },
    },

    "/api/v1/project/{projectId}/deploy-token": {
      get: {
        tags: ["Projeto"],
        summary: "Obter token de deploy",
        description:
          "Retorna o token de deploy do projeto. Este token é usado para " +
          "autenticar o endpoint `POST /api/v1/deploy`.",
        operationId: "getDeployToken",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Token de deploy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deploy_token: { type: "string", description: "Token UUID do projeto" },
                  },
                },
              },
            },
          },
          "403": { description: "Sem permissão" },
          "404": { description: "Projeto não encontrado" },
        },
      },
    },

    "/api/v1/project/{projectId}/regenerate-token": {
      post: {
        tags: ["Projeto"],
        summary: "Regenerar token de deploy",
        description:
          "Gera um novo token de deploy para o projeto. O token anterior " +
          "deixa de ser válido.",
        operationId: "regenerateDeployToken",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Token regenerado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deploy_token: {
                      type: "string",
                      description: "Novo token UUID",
                    },
                  },
                },
              },
            },
          },
          "403": { description: "Sem permissão" },
          "404": { description: "Projeto não encontrado" },
        },
      },
    },

    "/api/v1/project/my": {
      get: {
        tags: ["Projeto"],
        summary: "Meus projetos",
        description:
          "Retorna a lista paginada de projetos do utilizador autenticado, " +
          "com informações do deploy mais recente e estado de pagamento.",
        operationId: "getMyProjects",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
          {
            name: "name",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filtrar projetos por nome",
          },
        ],
        responses: {
          "200": {
            description: "Lista de projetos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    projects: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          subdomain: { type: "string" },
                          repo_url: { type: "string" },
                          run_status: { type: "boolean" },
                          paid: { type: "boolean" },
                          deploy: {
                            type: "object",
                            properties: {
                              status: { type: "string" },
                              commit_msg: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    perPage: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/project/update/{projectId}": {
      put: {
        tags: ["Projeto"],
        summary: "Atualizar projeto",
        description:
          "Atualiza as configurações de um projeto. Apenas o utilizador com " +
          "papel de `master` pode atualizar o projeto.",
        operationId: "updateProject",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 3 },
                  description: { type: "string", minLength: 10 },
                  branch: { type: "string", minLength: 3 },
                  port: { type: "integer", minimum: 1 },
                  period_duration: { type: "integer", minimum: 1 },
                  environments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string" },
                        value: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Projeto atualizado com sucesso" },
          "403": { description: "Apenas o master pode atualizar o projeto" },
          "404": { description: "Projeto não encontrado" },
        },
      },
    },

    "/api/v1/project/delete/{projectId}": {
      delete: {
        tags: ["Projeto"],
        summary: "Eliminar projeto",
        description:
          "Elimina um projeto e todos os seus dados associados (deploys, " +
          "pagamentos, variáveis de ambiente). Apenas o master pode eliminar.",
        operationId: "deleteProject",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Projeto eliminado com sucesso" },
          "403": { description: "Apenas o master pode eliminar o projeto" },
          "404": { description: "Projeto não encontrado" },
        },
      },
    },

    // ───── Member ─────
    "/api/v1/workspace/member/add": {
      post: {
        tags: ["Membros"],
        summary: "Adicionar membro ao workspace",
        description:
          "Adiciona um utilizador ao workspace do projeto com um papel específico.",
        operationId: "addMember",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "projectId", "role"],
                properties: {
                  username: {
                    type: "string",
                    description: "Username do utilizador a adicionar",
                  },
                  projectId: {
                    type: "string",
                    description: "ID do projeto",
                  },
                  role: {
                    type: "string",
                    enum: ["master", "admin", "member"],
                    description: "Papel do membro no workspace",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Membro adicionado com sucesso" },
          "403": { description: "Sem permissão" },
          "404": { description: "Utilizador ou projeto não encontrado" },
        },
      },
    },

    "/api/v1/workspace/member/remove": {
      delete: {
        tags: ["Membros"],
        summary: "Remover membro do workspace",
        description: "Remove um utilizador do workspace do projeto.",
        operationId: "removeMember",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "projectId"],
                properties: {
                  username: { type: "string" },
                  projectId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Membro removido com sucesso" },
          "403": { description: "Sem permissão" },
          "404": { description: "Membro ou projeto não encontrado" },
        },
      },
    },

    "/api/v1/workspace/member/list/{projectId}": {
      get: {
        tags: ["Membros"],
        summary: "Listar membros do workspace",
        description: "Retorna a lista paginada de membros do workspace do projeto.",
        operationId: "listMembers",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Lista de membros",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    members: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          username: { type: "string" },
                          email: { type: "string" },
                          role: { type: "string" },
                        },
                      },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ───── Deploy ─────
    "/api/v1/deploy": {
      post: {
        tags: ["Deploy"],
        summary: "Executar deploy",
        description:
          "Faz o deploy de uma aplicação Docker. Requer o **deploy_token** " +
          "do projeto no header `Authorization: Bearer <token>`.\n\n" +
          "O deploy envolve:\n" +
          "1. Pull da imagem Docker\n" +
          "2. Parar e remover o container antigo (se existir)\n" +
          "3. Iniciar novo container com configurações Traefik\n" +
          "4. Limpeza de imagens não utilizadas",
        operationId: "deployApp",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["app", "image"],
                properties: {
                  app: {
                    type: "string",
                    description:
                      "Nome da aplicação (subdomínio do projeto)",
                    example: "meu-app",
                  },
                  image: {
                    type: "string",
                    description: "Imagem Docker a fazer deploy",
                    example: "ghcr.io/joaosilva/meu-app:latest",
                  },
                  port: {
                    type: "integer",
                    description: "Porta interna da aplicação",
                    default: 3000,
                    example: 3000,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Deploy concluído com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    url: {
                      type: "string",
                      example: "https://meu-app.drenoday.enor.tech",
                    },
                  },
                },
              },
            },
          },
          "500": { description: "Falha no deploy" },
        },
      },
    },

    "/api/v1/deploy/all/{projectId}": {
      get: {
        tags: ["Deploy"],
        summary: "Listar deploys do projeto",
        description: "Retorna o histórico paginado de deploys de um projeto.",
        operationId: "listDeploys",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Lista de deploys",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deploys: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          status: { type: "string" },
                          success: { type: "boolean", nullable: true },
                          commit_msg: { type: "string", nullable: true },
                          commit_branch: { type: "string", nullable: true },
                          commit_author: { type: "string", nullable: true },
                          created_at: {
                            type: "string",
                            format: "date-time",
                          },
                        },
                      },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    perPage: { type: "integer" },
                  },
                },
              },
            },
          },
          "403": { description: "Sem permissão" },
        },
      },
    },

    "/api/v1/deploy/each/{deployId}": {
      get: {
        tags: ["Deploy"],
        summary: "Obter detalhes do deploy",
        description: "Retorna os detalhes de um deploy específico.",
        operationId: "getDeploy",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "deployId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Detalhes do deploy" },
          "403": { description: "Sem permissão" },
          "404": { description: "Deploy não encontrado" },
        },
      },
    },

    "/api/v1/deploy/{deployId}/logs": {
      get: {
        tags: ["Deploy"],
        summary: "Obter logs do deploy",
        description: "Retorna os logs de um deploy específico.",
        operationId: "getDeployLogs",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "deployId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Logs do deploy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    logs: {
                      type: "array",
                      items: { type: "string" },
                    },
                    status: { type: "string" },
                    success: { type: "boolean", nullable: true },
                  },
                },
              },
            },
          },
          "403": { description: "Sem permissão" },
          "404": { description: "Deploy não encontrado" },
        },
      },
    },

    "/api/v1/deploy/{deployId}/cancel": {
      post: {
        tags: ["Deploy"],
        summary: "Cancelar deploy",
        description:
          "Cancela um deploy em execução. Para o container Docker associado " +
          "e marca o deploy como cancelado.",
        operationId: "cancelDeploy",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "deployId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Deploy cancelado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Deploy cancelado com sucesso",
                    },
                  },
                },
              },
            },
          },
          "403": { description: "Sem permissão" },
          "404": { description: "Deploy não encontrado" },
        },
      },
    },

    // ───── Plan ─────
    "/api/v1/plan/create": {
      post: {
        tags: ["Planos"],
        summary: "Criar novo plano",
        description:
          "Cria um novo plano de assinatura com preço, duração e limite de projetos.",
        operationId: "createPlan",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "description", "price", "duration", "max_projects"],
                properties: {
                  name: { type: "string", minLength: 3, example: "Básico" },
                  description: {
                    type: "string",
                    minLength: 10,
                    example: "Plano ideal para começar",
                  },
                  price: {
                    type: "number",
                    minimum: 0, exclusiveMinimum: true,
                    example: 19.99,
                  },
                  duration: {
                    type: "integer",
                    minimum: 1,
                    description: "Duração em dias",
                    example: 30,
                  },
                  max_projects: {
                    type: "integer",
                    minimum: 1,
                    example: 3,
                    description: "Número máximo de projetos",
                  },
                  duration_description: {
                    type: "string",
                    example: "30 dias",
                  },
                  features: {
                    type: "array",
                    items: { type: "string" },
                    example: ["SSL grátis", "Suporte 24/7"],
                  },
                  shortcut: {
                    type: "string",
                    example: "basico2025",
                    description: "Atalho único para identificar o plano",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Plano criado com sucesso" },
          "400": { description: "Dados inválidos" },
        },
      },
    },

    "/api/v1/plan/update/{planId}": {
      put: {
        tags: ["Planos"],
        summary: "Atualizar plano",
        description: "Atualiza as configurações de um plano existente.",
        operationId: "updatePlan",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "planId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 3 },
                  description: { type: "string", minLength: 10 },
                  price: { type: "number", minimum: 0, exclusiveMinimum: true },
                  duration: { type: "integer", minimum: 1 },
                  max_projects: { type: "integer", minimum: 1 },
                  duration_description: { type: "string" },
                  features: { type: "array", items: { type: "string" } },
                  shortcut: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Plano atualizado com sucesso" },
          "404": { description: "Plano não encontrado" },
        },
      },
    },

    "/api/v1/plan/all": {
      get: {
        tags: ["Planos"],
        summary: "Listar todos os planos",
        description: "Retorna todos os planos de assinatura disponíveis.",
        operationId: "getPlans",
        responses: {
          "200": {
            description: "Lista de planos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      description: { type: "string" },
                      price: { type: "number" },
                      duration: { type: "integer" },
                      max_projects: { type: "integer" },
                      features: {
                        type: "array",
                        items: { type: "string" },
                      },
                      shortcut: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/plan/each/{planId}": {
      get: {
        tags: ["Planos"],
        summary: "Obter plano por ID",
        description: "Retorna os detalhes de um plano específico.",
        operationId: "getPlanById",
        parameters: [
          {
            name: "planId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Detalhes do plano" },
          "404": { description: "Plano não encontrado" },
        },
      },
    },

    "/api/v1/plan/delete/{planId}": {
      delete: {
        tags: ["Planos"],
        summary: "Eliminar plano",
        description: "Remove um plano de assinatura.",
        operationId: "deletePlan",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "planId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Plano eliminado com sucesso" },
          "404": { description: "Plano não encontrado" },
        },
      },
    },

    // ───── Payment ─────
    "/api/v1/pay/create": {
      post: {
        tags: ["Pagamentos"],
        summary: "Criar pagamento",
        description:
          "Regista um novo pagamento com comprovativo para um projeto.",
        operationId: "createPayment",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["projectId", "proof_payment"],
                properties: {
                  projectId: { type: "string", description: "ID do projeto" },
                  proof_payment: {
                    type: "string",
                    description: "Comprovativo de pagamento (base64 ou URL)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Pagamento registado com sucesso" },
        },
      },
    },

    "/api/v1/pay/confirm": {
      post: {
        tags: ["Pagamentos"],
        summary: "Confirmar/rejeitar pagamento",
        description:
          "Confirma ou rejeita um pagamento pendente. Envia notificação via socket.",
        operationId: "confirmPayment",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["paymentId", "status"],
                properties: {
                  paymentId: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["approved", "rejected"],
                    description: "Novo estado do pagamento",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Pagamento atualizado com sucesso" },
        },
      },
    },

    "/api/v1/pay/my": {
      get: {
        tags: ["Pagamentos"],
        summary: "Meus pagamentos",
        description: "Retorna os pagamentos do utilizador autenticado.",
        operationId: "getMyPayments",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filtrar por estado (ex: pending, approved, rejected)",
          },
        ],
        responses: {
          "200": {
            description: "Lista de pagamentos",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      status: { type: "string" },
                      amount: { type: "number" },
                      proof_payment: { type: "string" },
                      created_at: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/pay/each/{paymentId}": {
      get: {
        tags: ["Pagamentos"],
        summary: "Obter pagamento por ID",
        description: "Retorna os detalhes de um pagamento específico.",
        operationId: "getPaymentById",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "paymentId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Detalhes do pagamento" },
          "404": { description: "Pagamento não encontrado" },
        },
      },
    },

    "/api/v1/pay/reference": {
      post: {
        tags: ["Pagamentos"],
        summary: "Criar referência de pagamento",
        description:
          "Cria uma referência de pagamento através do gateway de pagamento.",
        operationId: "createPaymentReference",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["description", "projectId", "plan_name"],
                properties: {
                  description: { type: "string", description: "Descrição do pagamento" },
                  projectId: { type: "string" },
                  plan_name: { type: "string", description: "Nome do plano" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Referência criada com sucesso" },
        },
      },
    },

    "/api/v1/pay/webhook": {
      post: {
        tags: ["Pagamentos"],
        summary: "Webhook de pagamento",
        description:
          "Endpoint para receber notificações do gateway de pagamento " +
          "sobre alterações de estado dos pagamentos.",
        operationId: "paymentWebhook",
        responses: {
          "200": { description: "Webhook processado com sucesso" },
        },
      },
    },

    // ───── Notification ─────
    "/api/v1/notification/my": {
      get: {
        tags: ["Notificações"],
        summary: "Minhas notificações",
        description: "Retorna as notificações do utilizador autenticado de forma paginada.",
        operationId: "myNotifications",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Lista de notificações",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    notifications: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          type: { type: "string" },
                          message: { type: "string" },
                          read: { type: "boolean" },
                          created_at: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    perPage: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/notification/read/{notificationId}": {
      post: {
        tags: ["Notificações"],
        summary: "Marcar notificação como lida",
        description: "Marca uma notificação específica como lida.",
        operationId: "markNotificationAsRead",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "notificationId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Notificação marcada como lida" },
          "404": { description: "Notificação não encontrada" },
        },
      },
    },

    "/api/v1/notification/each/{notificationId}": {
      get: {
        tags: ["Notificações"],
        summary: "Obter notificação por ID",
        description: "Retorna os detalhes de uma notificação específica.",
        operationId: "getOneNotification",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "notificationId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Detalhes da notificação" },
          "404": { description: "Notificação não encontrada" },
        },
      },
    },

    // ───── Environment ─────
    "/api/v1/env/save/{projectId}": {
      post: {
        tags: ["Variáveis de Ambiente"],
        summary: "Guardar variáveis de ambiente",
        description:
          "Guarda ou atualiza variáveis de ambiente de um projeto. " +
          "Os valores são armazenados de forma encriptada.",
        operationId: "saveEnvVars",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["environments"],
                properties: {
                  environments: {
                    type: "array",
                    description: "Lista de variáveis de ambiente",
                    items: {
                      type: "object",
                      required: ["key", "value"],
                      properties: {
                        key: {
                          type: "string",
                          description: "Nome da variável",
                          example: "DATABASE_URL",
                        },
                        value: {
                          type: "string",
                          description: "Valor da variável (será encriptado)",
                          example: "postgresql://localhost:5432/db",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Variáveis guardadas com sucesso" },
          "403": { description: "Sem permissão" },
        },
      },
    },

    "/api/v1/env/list/{projectId}": {
      get: {
        tags: ["Variáveis de Ambiente"],
        summary: "Listar variáveis de ambiente",
        description:
          "Retorna a lista paginada de variáveis de ambiente de um projeto.",
        operationId: "listEnvVars",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Lista de variáveis de ambiente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    environments: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          key: { type: "string" },
                          created_at: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
          "403": { description: "Sem permissão" },
        },
      },
    },

    "/api/v1/env/delete/{projectId}/{envId}": {
      delete: {
        tags: ["Variáveis de Ambiente"],
        summary: "Eliminar variável de ambiente",
        description: "Remove uma variável de ambiente específica de um projeto.",
        operationId: "deleteEnvVar",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "envId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Variável eliminada com sucesso" },
          "403": { description: "Sem permissão" },
        },
      },
    },

    // ───── Metrics ─────
    "/api/v1/project/metrics/{projectId}": {
      get: {
        tags: ["Métricas"],
        summary: "Métricas de um projeto",
        description:
          "Retorna métricas específicas de um projeto (CPU, memória, etc).",
        operationId: "getProjectMetrics",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Métricas do projeto",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    cpu: { type: "string" },
                    memory: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
          "403": { description: "Sem permissão" },
        },
      },
    },

    "/api/v1/project/metrics": {
      get: {
        tags: ["Métricas"],
        summary: "Métricas gerais do utilizador",
        description: "Retorna métricas agregadas de todos os projetos do utilizador.",
        operationId: "getMyGeneralMetrics",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Métricas gerais" },
        },
      },
    },

    "/api/v1/metrics/general": {
      get: {
        tags: ["Métricas"],
        summary: "Métricas do servidor (VPS)",
        description: "Retorna métricas do servidor VPS onde a plataforma está alojada.",
        operationId: "getVpsMetrics",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Métricas do VPS" },
        },
      },
    },

    // ───── Backoffice ─────
    "/api/v1/backoffice/project/list": {
      get: {
        tags: ["Backoffice"],
        summary: "Listar todos os projetos (backoffice)",
        description:
          "Endpoint administrativo para listar todos os projetos com " +
          "informações de pagamento e deploy.",
        operationId: "backofficeListProjects",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Lista de projetos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    projects: { type: "array", items: { type: "object" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    perPage: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/v1/backoffice/pay/list": {
      get: {
        tags: ["Backoffice"],
        summary: "Listar todos os pagamentos (backoffice)",
        description:
          "Endpoint administrativo para listar todos os pagamentos.",
        operationId: "backofficeListPayments",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "per_page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Lista de pagamentos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    payments: { type: "array", items: { type: "object" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                    perPage: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ───── Cookies (dev) ─────
    "/api/v1/cookie/create": {
      get: {
        tags: ["Cookies (dev)"],
        summary: "Criar cookie de sessão (dev)",
        description: "Endpoint de desenvolvimento para criar cookies de sessão manualmente.",
        operationId: "createCookie",
        responses: {
          "200": { description: "Cookie criado" },
        },
      },
    },

    "/api/v1/cookie/read": {
      get: {
        tags: ["Cookies (dev)"],
        summary: "Ler cookies (dev)",
        description: "Endpoint de desenvolvimento para inspecionar cookies da requisição.",
        operationId: "readCookie",
        responses: {
          "200": { description: "Cookies da requisição" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Token JWT obtido no login.\n\n" +
          "Enviar no header: `Authorization: Bearer <token>`",
      },
      deployToken: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "UUID",
        description:
          "Token específico do projeto para fazer deploy.\n\n" +
          "Enviar no header: `Authorization: Bearer <deploy_token>`",
      },
    },
  },
  tags: [
    { name: "Health", description: "Endpoints de monitorização" },
    { name: "Autenticação", description: "Login, registo e recuperação de conta" },
    { name: "Utilizador", description: "Gestão de perfil de utilizador" },
    { name: "GitHub", description: "Integração com GitHub" },
    { name: "Projeto", description: "Gestão de projetos de hospedagem" },
    { name: "Membros", description: "Gestão de membros do workspace" },
    { name: "Deploy", description: "Deploy e gestão de aplicações" },
    { name: "Planos", description: "Planos de assinatura" },
    { name: "Pagamentos", description: "Pagamentos e faturas" },
    {
      name: "Notificações",
      description: "Notificações do sistema",
    },
    {
      name: "Variáveis de Ambiente",
      description: "Gestão de variáveis de ambiente dos projetos",
    },
    { name: "Métricas", description: "Métricas de projetos e servidor" },
    { name: "Backoffice", description: "Endpoints administrativos" },
    { name: "Cookies (dev)", description: "Endpoints auxiliares para desenvolvimento" },
  ],
  externalDocs: {
    description: "Repositório no GitHub",
    url: "https://github.com/drenoday/platform",
  },
};
