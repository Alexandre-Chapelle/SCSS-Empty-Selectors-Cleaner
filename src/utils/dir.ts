import * as path from "path";
import fg from "fast-glob";

export async function findScssFiles(dir: string): Promise<string[]> {
  const pattern = path.join(dir, "**/*.scss").replace(/\\/g, "/");
  const entries = await fg([pattern], { dot: true });
  return entries;
}
