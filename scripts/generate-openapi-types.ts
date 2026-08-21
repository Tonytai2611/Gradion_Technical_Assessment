import fs from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";
import { openApiDocument } from "../backend/src/openapi.js";

const ast = await openapiTS(openApiDocument as never);
const output = astToString(ast);

await fs.mkdir("frontend/src/shared/api", { recursive: true });
await fs.writeFile(
  "frontend/src/shared/api/generated-openapi.ts",
  [
    "/* eslint-disable */",
    "// This file is generated from backend/src/openapi.ts. Run `npm run generate:api-types` after API changes.",
    output
  ].join("\n")
);
