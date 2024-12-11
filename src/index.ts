import { $ } from "bun";
import { getDirectory, getFeatureType, getOptions } from "./prompts";
import { EmptySelectors, RefactorTransitions } from "./features";
import type { FeatureStartPayload } from "./types";

const emptySelectors = new EmptySelectors();
const refactorTransitions = new RefactorTransitions();

async function getSelectedFunction() {
  const targetDir = await getDirectory();
  const { backupsEnabled, loggingEnabled } = await getOptions();
  const feature = await getFeatureType();

  const startPayload: FeatureStartPayload = {
    targetDir,
    loggingEnabled,
    backupsEnabled,
  };

  if (feature === "scss-clean-unused-selectors") {
    emptySelectors.start(startPayload);
  } else {
    refactorTransitions.start(startPayload);
  }
}

async function main() {
  console.log("🧹 SCSS Refactor Tool");
  await getSelectedFunction();

  $`pause`;
  console.log(`\n>✅ Done`);
}

main().catch((error) => {
  console.error("❌ An error occurred:", error);
});
