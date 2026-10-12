import { mistral } from "@ai-sdk/mistral";

/** Server-only. Reads MISTRAL_API_KEY. Do not import this from a client component. */
export const routineModel = mistral("mistral-small-latest");
