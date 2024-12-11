export * from "./scss";

// CSS WIP, if you are seeing this, you might also want to contribute.
// Implement clean-unused-selectors, refactor-transitions for pure css
// You are welcome to implement clean-unused-selectors, refactor-transitions for other preprocessors.
export type StylesheetType = "scss" /* | "css" */;
export type SearchType = "clean-unused-selectors" | "refactor-transitions";
export type SelectedFunctionality = `${StylesheetType}-${SearchType}`;
export const features: SelectedFunctionality[] = [
  "scss-clean-unused-selectors",
  "scss-refactor-transitions",
];

export interface FeatureStartPayload {
  targetDir: string;
  loggingEnabled: boolean;
  backupsEnabled: boolean;
}
