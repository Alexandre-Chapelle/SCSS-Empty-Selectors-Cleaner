import type { RemovalInfo } from "../types";
import { log } from "./logger";

export async function processFiles(
  filePaths: string[],
  callback: (filePath: string) => Promise<RemovalInfo[]>,
  loggingEnabled: boolean
): Promise<RemovalInfo[]> {
  const allRemovals: RemovalInfo[] = [];

  for (const file of filePaths) {
    log(`Processing file: ${file}`, loggingEnabled);
    const removals = await callback(file);

    if (removals.length > 0) {
      allRemovals.push(...removals);
    }
  }

  return allRemovals;
}
