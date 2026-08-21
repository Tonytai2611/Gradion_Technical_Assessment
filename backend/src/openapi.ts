export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Book Illustration Studio API",
    version: "0.1.0",
    description: "Local-only API for the Gradion Book Illustration Studio assessment."
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Default local backend"
    },
    {
      url: "http://localhost:3001/api",
      description: "Fallback local backend when port 3000 is busy"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Session" },
    { name: "Projects" },
    { name: "Pipeline" }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Backend is running",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" }
              }
            }
          }
        }
      }
    },
    "/session": {
      get: {
        tags: ["Session"],
        summary: "Get the current session",
        responses: {
          "200": {
            description: "Current user, or null when signed out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      oneOf: [{ $ref: "#/components/schemas/User" }, { type: "null" }]
                    }
                  },
                  required: ["user"]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Session"],
        summary: "Create or resume a lightweight session",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSessionRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Signed in",
            headers: {
              "Set-Cookie": {
                schema: { type: "string" },
                description: "HTTP-only session cookie"
              }
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } },
                  required: ["user"]
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" }
        }
      },
      delete: {
        tags: ["Session"],
        summary: "Sign out",
        responses: {
          "204": { description: "Signed out" }
        }
      }
    },
    "/projects": {
      get: {
        tags: ["Projects"],
        summary: "List projects for the signed-in user",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Projects",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    projects: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Project" }
                    }
                  },
                  required: ["projects"]
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/Unauthorized" }
        }
      },
      post: {
        tags: ["Projects"],
        summary: "Create a project from book text",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateProjectRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Created project",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { project: { $ref: "#/components/schemas/Project" } },
                  required: ["project"]
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" }
        }
      }
    },
    "/projects/{projectId}": {
      get: {
        tags: ["Projects"],
        summary: "Get project detail",
        security: [{ cookieAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ProjectId" }],
        responses: {
          "200": {
            description: "Project detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { project: { $ref: "#/components/schemas/ProjectDetail" } },
                  required: ["project"]
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" }
        }
      }
    },
    "/projects/{projectId}/images/{kind}/{fileName}": {
      get: {
        tags: ["Projects"],
        summary: "Serve a generated project image",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/ProjectId" },
          {
            name: "kind",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["characters", "chapters"] }
          },
          {
            name: "fileName",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Generated image file",
            content: {
              "image/png": { schema: { type: "string", format: "binary" } },
              "image/jpeg": { schema: { type: "string", format: "binary" } },
              "image/webp": { schema: { type: "string", format: "binary" } },
              "image/svg+xml": { schema: { type: "string", format: "binary" } }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" }
        }
      }
    },
    "/projects/{projectId}/steps/{step}/run": {
      post: {
        tags: ["Pipeline"],
        summary: "Run the current pipeline step",
        description: "The backend atomically claims the step before provider calls. A request that cannot claim the step returns a conflict.",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/ProjectId" },
          { $ref: "#/components/parameters/StepSlug" }
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RunStepRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Updated project state",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { project: { $ref: "#/components/schemas/Project" } },
                  required: ["project"]
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "422": { $ref: "#/components/responses/Unprocessable" }
        }
      }
    },
    "/projects/{projectId}/steps/{step}/recover": {
      post: {
        tags: ["Pipeline"],
        summary: "Recover a stale running step",
        description: "Marks a stale RUNNING step as FAILED so the user can explicitly retry it.",
        security: [{ cookieAuth: [] }],
        parameters: [
          { $ref: "#/components/parameters/ProjectId" },
          { $ref: "#/components/parameters/StepSlug" }
        ],
        responses: {
          "200": {
            description: "Recovered project state",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { project: { $ref: "#/components/schemas/Project" } },
                  required: ["project"]
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "422": { $ref: "#/components/responses/Unprocessable" }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "sid"
      }
    },
    parameters: {
      ProjectId: {
        name: "projectId",
        in: "path",
        required: true,
        schema: { type: "string" }
      },
      StepSlug: {
        name: "step",
        in: "path",
        required: true,
        schema: {
          type: "string",
          enum: ["style", "characters", "portraits", "chapters", "illustrations"]
        }
      }
    },
    responses: {
      BadRequest: {
        description: "Invalid request",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
      },
      Unauthorized: {
        description: "No active session",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
      },
      Conflict: {
        description: "Step conflict or duplicate execution attempt",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
      },
      Unprocessable: {
        description: "Invalid state transition",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
      }
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: { ok: { type: "boolean" } },
        required: ["ok"]
      },
      CreateSessionRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          email: { type: "string", format: "email" }
        },
        required: ["name", "email"]
      },
      CreateProjectRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1 },
          bookText: { type: "string", minLength: 1 }
        },
        required: ["title", "bookText"]
      },
      RunStepRequest: {
        type: "object",
        properties: {
          customStyle: { type: "string", description: "Optional style input used only for the style step." }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "name", "email", "createdAt", "updatedAt"]
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          title: { type: "string" },
          bookPath: { type: "string" },
          status: { type: "string", enum: ["DRAFT", "IN_PROGRESS", "DONE"] },
          currentStep: { type: "string", enum: ["STYLE", "CHARACTERS", "PORTRAITS", "CHAPTERS", "ILLUSTRATIONS"] },
          stepState: { type: "string", enum: ["READY", "RUNNING", "FAILED", "COMPLETED"] },
          stepStartedAt: { type: "string", nullable: true },
          lastError: { type: "string", nullable: true },
          style: { type: "string", nullable: true },
          geminiContextReference: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "userId", "title", "bookPath", "status", "currentStep", "stepState", "createdAt", "updatedAt"]
      },
      ProjectDetail: {
        allOf: [
          { $ref: "#/components/schemas/Project" },
          {
            type: "object",
            properties: {
              bookText: { type: "string" },
              isStale: { type: "boolean" },
              characters: { type: "array", items: { $ref: "#/components/schemas/Character" } },
              chapters: { type: "array", items: { $ref: "#/components/schemas/Chapter" } }
            },
            required: ["bookText", "isStale", "characters", "chapters"]
          }
        ]
      },
      Character: {
        type: "object",
        properties: {
          id: { type: "string" },
          projectId: { type: "string" },
          name: { type: "string" },
          prompt: { type: "string" },
          portraitPath: { type: "string", nullable: true },
          portraitMimeType: { type: "string", nullable: true },
          portraitSource: { type: "string", enum: ["gemini", "mock"], nullable: true },
          generationState: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "projectId", "name", "prompt", "generationState", "createdAt", "updatedAt"]
      },
      Chapter: {
        type: "object",
        properties: {
          id: { type: "string" },
          projectId: { type: "string" },
          name: { type: "string" },
          prompt: { type: "string" },
          illustrationPath: { type: "string", nullable: true },
          illustrationMimeType: { type: "string", nullable: true },
          illustrationSource: { type: "string", enum: ["gemini", "mock"], nullable: true },
          generationState: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "projectId", "name", "prompt", "generationState", "createdAt", "updatedAt"]
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string" }
        },
        required: ["error"]
      }
    }
  }
};
