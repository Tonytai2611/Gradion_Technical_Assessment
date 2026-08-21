import { GoogleGenAI } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "../../../shared/lib/errors.js";

export interface GeminiCharacterResult {
  name: string;
  prompt: string;
}

export interface GeminiChapterResult {
  name: string;
  prompt: string;
}

export interface GeminiContextReference {
  fileUri?: string;
  fileMimeType?: string;
  bookInteractionId?: string;
  styleInteractionId?: string;
  charactersInteractionId?: string;
  chaptersInteractionId?: string;
  lastImageInteractionId?: string;
  chapterImageSeedInteractionId?: string;
}

export interface GeneratedValue<T> {
  value: T;
  contextReference?: string;
}

export interface GeneratedImage {
  filePath: string;
  mimeType: string;
  source: "gemini" | "mock";
  contextReference?: string;
}

export interface TextGenerationProvider {
  generateStyle(input: {
    projectId: string;
    bookPath: string;
    bookText: string;
    customStyle?: string;
    contextReference?: string | null;
  }): Promise<GeneratedValue<string>>;
  generateCharacters(input: {
    projectId: string;
    bookPath: string;
    bookText: string;
    style: string;
    contextReference?: string | null;
  }): Promise<GeneratedValue<GeminiCharacterResult[]>>;
  generateChapters(input: {
    projectId: string;
    bookPath: string;
    bookText: string;
    style: string;
    characters: GeminiCharacterResult[];
    contextReference?: string | null;
  }): Promise<GeneratedValue<GeminiChapterResult[]>>;
}

export interface ImageGenerationProvider {
  generatePortrait(input: {
    projectId: string;
    characterId: string;
    characterIndex?: number;
    characterName: string;
    prompt: string;
    style?: string | null;
    contextReference?: string | null;
  }): Promise<GeneratedImage>;
  generateIllustration(input: {
    projectId: string;
    chapterId: string;
    chapterIndex?: number;
    chapterName: string;
    prompt: string;
    contextReference?: string | null;
  }): Promise<GeneratedImage>;
}

const promptArraySchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      prompt: { type: "string" }
    },
    required: ["name", "prompt"]
  }
};

const systemInstructions = [
  "Keep the illustration family consistent across the project.",
  "Avoid text, captions, watermarks, borders, page layouts, speech bubbles, or typography in images.",
  "Create polished storybook illustration assets suitable for a children's classic, while only depicting adult characters."
].join(" ");

export class FakeTextGenerationProvider implements TextGenerationProvider {
  async generateStyle(input: { customStyle?: string }) {
    return {
      value: input.customStyle?.trim() || "Warm watercolor storybook style with soft ink outlines."
    };
  }

  async generateCharacters() {
    return {
      value: [
        { name: "Character A", prompt: "Adult main character, described from the supplied book text." },
        { name: "Character B", prompt: "Adult supporting character, consistent with the book tone." },
        { name: "Ignored Extra", prompt: "This verifies the server-side cap." }
      ]
    };
  }

  async generateChapters() {
    return {
      value: [
        { name: "Opening Scene", prompt: "A single chapter illustration prompt referencing the generated characters." },
        { name: "Ignored Extra Chapter", prompt: "This verifies the server-side cap." }
      ]
    };
  }
}

export class GeminiTextProvider implements TextGenerationProvider {
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly modelId: string,
    private readonly serviceTier: "flex" | "standard" | "priority"
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateStyle(input: {
    bookPath: string;
    customStyle?: string;
    contextReference?: string | null;
  }) {
    const context = await this.ensureBookInteraction(input.bookPath, input.contextReference);
    const interaction = input.customStyle?.trim()
      ? await this.client.interactions.create({
          model: this.modelId,
          input: `The art style will be: "${input.customStyle.trim()}". Keep that in mind when generating future prompts. Keep quiet for now, instructions will follow.`,
          previous_interaction_id: context.bookInteractionId,
          service_tier: this.serviceTier
        } as any)
      : await this.client.interactions.create({
          model: this.modelId,
          input: "Can you define a art style that would fit the story but with a twist? Just give us the prompt for the art style that will be added to the future prompts.",
          previous_interaction_id: context.bookInteractionId,
          service_tier: this.serviceTier
        } as any);

    const style = input.customStyle?.trim() || interaction.output_text?.trim();
    if (!style) throw new AppError(502, "Gemini did not return an art style", "GEMINI_EMPTY_STYLE");

    return {
      value: style,
      contextReference: serializeContext({
        ...context,
        styleInteractionId: interaction.id
      })
    };
  }

  async generateCharacters(input: {
    bookPath: string;
    style: string;
    contextReference?: string | null;
  }) {
    const context = await this.ensureBookInteraction(input.bookPath, input.contextReference);
    if (!context.styleInteractionId) {
      throw new AppError(422, "Style interaction is missing before character generation", "MISSING_STYLE_INTERACTION");
    }
    const interaction = await this.client.interactions.create({
      model: this.modelId,
      input: "Can you describe the main characters (only the adults) and prepare a prompt describing them with as much details as possible (use the descriptions from the book) so Nano Banana can generate images of them? Each prompt should be at least 50 words.",
      previous_interaction_id: context.styleInteractionId,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: promptArraySchema
      },
      service_tier: this.serviceTier
    } as any);

    return {
      value: parsePromptArray(interaction.output_text, "characters"),
      contextReference: serializeContext({
        ...context,
        charactersInteractionId: interaction.id
      })
    };
  }

  async generateChapters(input: {
    bookPath: string;
    contextReference?: string | null;
  }) {
    const context = await this.ensureBookInteraction(input.bookPath, input.contextReference);
    if (!context.charactersInteractionId) {
      throw new AppError(422, "Character interaction is missing before chapter generation", "MISSING_CHARACTER_INTERACTION");
    }
    const interaction = await this.client.interactions.create({
      model: this.modelId,
      input: "Now, for each chapters of the book, give me a prompt to illustrate what happens in it. It should be a single image, not a multi-tiled page. Be very descriptive, especially of the characters. Be very descriptive and remember to tell their name and to reuse the character prompts if they appear in the images. Also list all characters who appear in it.",
      previous_interaction_id: context.charactersInteractionId,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: promptArraySchema
      },
      service_tier: this.serviceTier
    } as any);

    return {
      value: parsePromptArray(interaction.output_text, "chapters"),
      contextReference: serializeContext({
        ...context,
        chaptersInteractionId: interaction.id
      })
    };
  }

  private async ensureBookInteraction(bookPath: string, rawContext?: string | null) {
    const context = parseContext(rawContext);
    if (context.bookInteractionId) return context;

    const uploaded = await this.client.files.upload({
      file: bookPath,
      config: { mimeType: "text/plain" }
    });
    if (!uploaded.uri) {
      throw new AppError(502, "Gemini File API did not return a file URI", "GEMINI_FILE_URI_MISSING");
    }

    const bookInteraction = await this.client.interactions.create({
      model: this.modelId,
      input: [
        {
          type: "text",
          text: "Here's a book, to illustrate using Nano Banana. Don't say anything for now, instructions will follow."
        },
        {
          type: "document",
          uri: uploaded.uri,
          mime_type: uploaded.mimeType ?? "text/plain"
        }
      ],
      service_tier: this.serviceTier
    } as any);

    return {
      ...context,
      fileUri: uploaded.uri,
      fileMimeType: uploaded.mimeType ?? "text/plain",
      bookInteractionId: bookInteraction.id
    };
  }
}

export class GeminiImageProvider implements ImageGenerationProvider {
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly modelId: string,
    private readonly serviceTier: "flex" | "standard" | "priority",
    private readonly dataRoot: string
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generatePortrait(input: {
    projectId: string;
    characterId: string;
    characterIndex?: number;
    characterName: string;
    prompt: string;
    style?: string | null;
    contextReference?: string | null;
  }) {
    let context = parseContext(input.contextReference);
    if (!context.lastImageInteractionId) {
      const seed = await this.client.interactions.create({
        model: this.modelId,
        input: `
          You are going to generate portrait images to illustrate this book.
          The style we want you to follow is: Follow this style: "${input.style ?? "storybook watercolor"}"
          Also follow those rules: ${systemInstructions}
        `,
        service_tier: this.serviceTier
      } as any);
      context = { ...context, lastImageInteractionId: seed.id };
    }

    const interaction = await this.client.interactions.create({
      model: this.modelId,
      input: `Create an illustration for ${input.characterName} following this description: ${input.prompt}`,
      previous_interaction_id: context.lastImageInteractionId,
      service_tier: this.serviceTier
    } as any);

    const image = extractOutputImage(interaction);
    const saved = await saveGeneratedImage(this.dataRoot, input.projectId, "characters", input.characterId, image);
    return {
      ...saved,
      source: "gemini" as const,
      contextReference: serializeContext({
        ...context,
        lastImageInteractionId: interaction.id
      })
    };
  }

  async generateIllustration(input: {
    projectId: string;
    chapterId: string;
    chapterIndex?: number;
    chapterName: string;
    prompt: string;
    contextReference?: string | null;
  }) {
    let context = parseContext(input.contextReference);
    if (!context.lastImageInteractionId) {
      throw new AppError(422, "Portrait image interaction is missing before chapter illustration generation", "MISSING_IMAGE_INTERACTION");
    }
    if (!context.chapterImageSeedInteractionId) {
      const seed = await this.client.interactions.create({
        model: this.modelId,
        input: "Starting from now, we're going to illustrate the book's chapters. Don't forget to refer to your previous illustrations of the characters to keep the characters consistency, but feel free to change their position.",
        previous_interaction_id: context.lastImageInteractionId,
        service_tier: this.serviceTier
      } as any);
      context = {
        ...context,
        lastImageInteractionId: seed.id,
        chapterImageSeedInteractionId: seed.id
      };
    }

    const interaction = await this.client.interactions.create({
      model: this.modelId,
      input: `Create an illustration for ${input.chapterName} using the previously generated characters following this description: ${input.prompt}`,
      previous_interaction_id: context.lastImageInteractionId,
      service_tier: this.serviceTier
    } as any);

    const image = extractOutputImage(interaction);
    const saved = await saveGeneratedImage(this.dataRoot, input.projectId, "chapters", input.chapterId, image);
    return {
      ...saved,
      source: "gemini" as const,
      contextReference: serializeContext({
        ...context,
        lastImageInteractionId: interaction.id
      })
    };
  }
}

export class MockImageProvider implements ImageGenerationProvider {
  constructor(
    private readonly dataRoot: string,
    private readonly assetRoot = fileURLToPath(new URL("../../../../assets/mock", import.meta.url))
  ) {}

  async generatePortrait(input: { projectId: string; characterId: string; characterIndex?: number; contextReference?: string | null }) {
    const assetNumber = (input.characterIndex ?? 0) % 2 === 0 ? 1 : 2;
    return {
      ...(await this.copyMockAsset({
        projectId: input.projectId,
        itemId: input.characterId,
        kind: "characters",
        assetName: `portrait-${assetNumber}.png`
      })),
      contextReference: input.contextReference ?? undefined
    };
  }

  async generateIllustration(input: { projectId: string; chapterId: string; contextReference?: string | null }) {
    return {
      ...(await this.copyMockAsset({
        projectId: input.projectId,
        itemId: input.chapterId,
        kind: "chapters",
        assetName: "illustration-1.png"
      })),
      contextReference: input.contextReference ?? undefined
    };
  }

  private async copyMockAsset(input: { projectId: string; itemId: string; kind: "characters" | "chapters"; assetName: string }): Promise<GeneratedImage> {
    const targetDir = path.resolve(this.dataRoot, "images", input.projectId, input.kind);
    const targetPath = path.resolve(targetDir, `${input.itemId}${path.extname(input.assetName)}`);
    if (!targetPath.startsWith(targetDir)) {
      throw new Error("Unsafe mock image path");
    }
    await fs.mkdir(targetDir, { recursive: true });
    await fs.copyFile(path.resolve(this.assetRoot, input.assetName), targetPath);
    return {
      filePath: targetPath,
      mimeType: mimeTypeForPath(targetPath),
      source: "mock"
    };
  }
}

export class QuotaFallbackImageProvider implements ImageGenerationProvider {
  constructor(
    private readonly primary: ImageGenerationProvider,
    private readonly fallback: ImageGenerationProvider,
    private readonly log: Pick<Console, "warn"> = console
  ) {}

  async generatePortrait(input: {
    projectId: string;
    characterId: string;
    characterIndex?: number;
    characterName: string;
    prompt: string;
    style?: string | null;
    contextReference?: string | null;
  }) {
    try {
      return await this.primary.generatePortrait(input);
    } catch (error) {
      if (!isQuotaOrRateLimitError(error)) throw error;
      this.log.warn(`Gemini image quota/rate limit hit for portrait ${input.characterId}; using mock image fallback.`);
      return this.fallback.generatePortrait(input);
    }
  }

  async generateIllustration(input: {
    projectId: string;
    chapterId: string;
    chapterIndex?: number;
    chapterName: string;
    prompt: string;
    contextReference?: string | null;
  }) {
    try {
      return await this.primary.generateIllustration(input);
    } catch (error) {
      if (!isQuotaOrRateLimitError(error) && !isMissingGeminiImageReferenceError(error)) throw error;
      this.log.warn(`Gemini image unavailable for chapter ${input.chapterId}; using mock image fallback.`);
      return this.fallback.generateIllustration(input);
    }
  }
}

export function isQuotaOrRateLimitError(error: unknown) {
  const maybe = error as { status?: number; code?: string; message?: string };
  const message = maybe?.message?.toLowerCase() ?? "";
  return maybe?.status === 429
    || maybe?.code === "RESOURCE_EXHAUSTED"
    || message.includes("resource_exhausted")
    || message.includes("quota exceeded")
    || message.includes("rate limit exceeded");
}

export function isMissingGeminiImageReferenceError(error: unknown) {
  const maybe = error as { code?: string };
  return maybe?.code === "MISSING_IMAGE_INTERACTION";
}

export function parseContext(raw?: string | null): GeminiContextReference {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as GeminiContextReference;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeContext(context: GeminiContextReference) {
  return JSON.stringify(context);
}

function parsePromptArray(raw: string | undefined, label: string) {
  if (!raw) throw new AppError(502, `Gemini did not return ${label} JSON`, "GEMINI_EMPTY_JSON");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new AppError(502, `Gemini ${label} response was not an array`, "GEMINI_INVALID_JSON");
  }
  return parsed.map((item) => {
    const record = item as { name?: unknown; prompt?: unknown };
    if (typeof record.name !== "string" || typeof record.prompt !== "string") {
      throw new AppError(502, `Gemini ${label} item missed name or prompt`, "GEMINI_INVALID_JSON");
    }
    return {
      name: record.name,
      prompt: record.prompt
    };
  });
}

function extractOutputImage(interaction: any) {
  const direct = interaction.output_image;
  if (direct?.data && direct?.mime_type) {
    return { data: direct.data as string, mimeType: direct.mime_type as string };
  }
  for (const step of [...(interaction.steps ?? [])].reverse()) {
    if (step?.type !== "model_output" || !step.content) continue;
    for (const content of [...step.content].reverse()) {
      if (content?.type === "image" && content.data) {
        return {
          data: content.data as string,
          mimeType: (content.mime_type ?? "image/png") as string
        };
      }
    }
  }
  throw new AppError(502, "Gemini did not return an image", "GEMINI_IMAGE_MISSING");
}

async function saveGeneratedImage(
  dataRoot: string,
  projectId: string,
  kind: "characters" | "chapters",
  itemId: string,
  image: { data: string; mimeType: string }
) {
  const extension = image.mimeType === "image/jpeg" ? "jpg" : image.mimeType === "image/webp" ? "webp" : "png";
  const targetDir = path.resolve(dataRoot, "images", projectId, kind);
  const targetPath = path.resolve(targetDir, `${itemId}.${extension}`);
  if (!targetPath.startsWith(targetDir)) {
    throw new Error("Unsafe generated image path");
  }
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, Buffer.from(image.data, "base64"));
  return {
    filePath: targetPath,
    mimeType: image.mimeType
  };
}

function mimeTypeForPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "image/png";
}
