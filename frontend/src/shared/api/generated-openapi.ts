/* eslint-disable */
// This file is generated from backend/src/openapi.ts. Run `npm run generate:api-types` after API changes.
export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health check */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Backend is running */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HealthResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get the current session */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Current user, or null when signed out */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            user: components["schemas"]["User"] | null;
                        };
                    };
                };
            };
        };
        put?: never;
        /** Create or resume a lightweight session */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateSessionRequest"];
                };
            };
            responses: {
                /** @description Signed in */
                201: {
                    headers: {
                        /** @description HTTP-only session cookie */
                        "Set-Cookie"?: string;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            user: components["schemas"]["User"];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
            };
        };
        /** Sign out */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Signed out */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/projects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List projects for the signed-in user */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Projects */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            projects: components["schemas"]["Project"][];
                        };
                    };
                };
                401: components["responses"]["Unauthorized"];
            };
        };
        put?: never;
        /** Create a project from book text */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateProjectRequest"];
                };
            };
            responses: {
                /** @description Created project */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            project: components["schemas"]["Project"];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/projects/{projectId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get project detail */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectId: components["parameters"]["ProjectId"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Project detail */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            project: components["schemas"]["ProjectDetail"];
                        };
                    };
                };
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/projects/{projectId}/images/{kind}/{fileName}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Serve a generated project image */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectId: components["parameters"]["ProjectId"];
                    kind: "characters" | "chapters";
                    fileName: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Generated image file */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "image/png": string;
                        "image/jpeg": string;
                        "image/webp": string;
                        "image/svg+xml": string;
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/projects/{projectId}/steps/{step}/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Run the current pipeline step
         * @description The backend atomically claims the step before provider calls. A request that cannot claim the step returns a conflict.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectId: components["parameters"]["ProjectId"];
                    step: components["parameters"]["StepSlug"];
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["RunStepRequest"];
                };
            };
            responses: {
                /** @description Updated project state */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            project: components["schemas"]["Project"];
                        };
                    };
                };
                400: components["responses"]["BadRequest"];
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                422: components["responses"]["Unprocessable"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/projects/{projectId}/steps/{step}/recover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Recover a stale running step
         * @description Marks a stale RUNNING step as FAILED so the user can explicitly retry it.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    projectId: components["parameters"]["ProjectId"];
                    step: components["parameters"]["StepSlug"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Recovered project state */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            project: components["schemas"]["Project"];
                        };
                    };
                };
                401: components["responses"]["Unauthorized"];
                404: components["responses"]["NotFound"];
                409: components["responses"]["Conflict"];
                422: components["responses"]["Unprocessable"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        HealthResponse: {
            ok: boolean;
        };
        CreateSessionRequest: {
            name: string;
            /** Format: email */
            email: string;
        };
        CreateProjectRequest: {
            title: string;
            bookText: string;
        };
        RunStepRequest: {
            /** @description Optional style input used only for the style step. */
            customStyle?: string;
        };
        User: {
            id: string;
            name: string;
            /** Format: email */
            email: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        Project: {
            id: string;
            userId: string;
            title: string;
            bookPath: string;
            /** @enum {string} */
            status: "DRAFT" | "IN_PROGRESS" | "DONE";
            /** @enum {string} */
            currentStep: "STYLE" | "CHARACTERS" | "PORTRAITS" | "CHAPTERS" | "ILLUSTRATIONS";
            /** @enum {string} */
            stepState: "READY" | "RUNNING" | "FAILED" | "COMPLETED";
            stepStartedAt?: string | null;
            lastError?: string | null;
            style?: string | null;
            geminiContextReference?: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        ProjectDetail: components["schemas"]["Project"] & {
            bookText: string;
            isStale: boolean;
            characters: components["schemas"]["Character"][];
            chapters: components["schemas"]["Chapter"][];
        };
        Character: {
            id: string;
            projectId: string;
            name: string;
            prompt: string;
            portraitPath?: string | null;
            portraitMimeType?: string | null;
            /** @enum {string|null} */
            portraitSource?: "gemini" | "mock" | null;
            generationState: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        Chapter: {
            id: string;
            projectId: string;
            name: string;
            prompt: string;
            illustrationPath?: string | null;
            illustrationMimeType?: string | null;
            /** @enum {string|null} */
            illustrationSource?: "gemini" | "mock" | null;
            generationState: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        ErrorResponse: {
            error: string;
            code?: string;
        };
    };
    responses: {
        /** @description Invalid request */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description No active session */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Resource not found */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Step conflict or duplicate execution attempt */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Invalid state transition */
        Unprocessable: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
    };
    parameters: {
        ProjectId: string;
        StepSlug: "style" | "characters" | "portraits" | "chapters" | "illustrations";
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
