import fs from "node:fs/promises";
import path from "node:path";

export async function writeProjectBook(dataRoot: string, projectId: string, text: string) {
  const projectDir = path.resolve(dataRoot, "books", projectId);
  const filePath = path.resolve(projectDir, "book.txt");
  if (!filePath.startsWith(projectDir)) {
    throw new Error("Unsafe book path");
  }
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(filePath, text, "utf8");
  return filePath;
}

export async function readTextFile(filePath: string) {
  return fs.readFile(filePath, "utf8");
}

export async function ensureImageDirs(dataRoot: string, projectId: string) {
  await fs.mkdir(path.resolve(dataRoot, "images", projectId, "characters"), { recursive: true });
  await fs.mkdir(path.resolve(dataRoot, "images", projectId, "chapters"), { recursive: true });
}
