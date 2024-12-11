import * as fs from "fs";
import postcss, { Root, Rule, AtRule } from "postcss";
import scss from "postcss-scss";
import type { FeatureStartPayload, RemovalInfo } from "../types";
import { log, processFiles } from "../utils";
import { findScssFiles } from "../utils/dir";

export class EmptySelectors {
  public loggingEnabled: boolean = false;
  public backupsEnabled: boolean = false;

  public start = async ({
    targetDir,
    loggingEnabled,
    backupsEnabled,
  }: FeatureStartPayload): Promise<void> => {
    this.loggingEnabled = loggingEnabled;
    this.backupsEnabled = backupsEnabled;

    log(`\n🔍 Searching for .scss files in: ${targetDir}`, loggingEnabled);
    const scssFiles = await findScssFiles(targetDir);

    if (scssFiles.length === 0) {
      log("❌ No .scss files found in the specified directory.", true);
      return;
    }

    log(`Found ${scssFiles.length} .scss file(s).\n`, loggingEnabled);

    const removals = await processFiles(
      scssFiles,
      this.processScssFile,
      loggingEnabled
    );

    if (removals.length === 0) {
      log("✅ No empty selectors found!", loggingEnabled);
      return;
    }

    log("\n🚫 Removed empty selectors:\n", loggingEnabled);

    removals.forEach((info) => {
      log(`File: ${info.filePath}`, loggingEnabled);
      log(`  Selector: ${info.selector}`, loggingEnabled);
      log(`  Line: ${info.line}\n`, loggingEnabled);
    });

    log("🎉 Cleanup complete!", loggingEnabled);
  };

  public processScssFile = async (filePath: string): Promise<RemovalInfo[]> => {
    const content = fs.readFileSync(filePath, "utf-8");
    const ast: Root = scss.parse(content, { from: filePath });

    const removals: RemovalInfo[] = [];

    let hasChanges = false;

    const processRules = (node: postcss.Container) => {
      node.walkRules((rule: Rule) => {
        processRules(rule);

        const hasDeclarations = rule.nodes?.some(
          (child) => child.type === "decl" && child.value.trim() !== ""
        );

        const hasNestedRules = rule.nodes?.some(
          (child) => child.type === "rule" || child.type === "atrule"
        );

        if (!hasDeclarations && !hasNestedRules) {
          const line = rule.source?.start?.line || 0;
          removals.push({
            filePath,
            selector: rule.selector,
            line,
          });

          rule.remove();
          hasChanges = true;
        }
      });

      node.walkAtRules((atRule: AtRule) => {
        processRules(atRule);

        const hasChildren = atRule.nodes && atRule.nodes.length > 0;

        if (!hasChildren) {
          const line = atRule.source?.start?.line || 0;
          removals.push({
            filePath,
            selector: `@${atRule.name} ${atRule.params}`,
            line,
          });

          atRule.remove();
          hasChanges = true;
        }
      });
    };

    processRules(ast);

    if (hasChanges) {
      if (this.backupsEnabled) {
        const backupPath = `${filePath}.bak`;
        fs.copyFileSync(filePath, backupPath);
        log(`📂 Backup created at: ${backupPath}`, this.loggingEnabled);
      }

      const result = ast.toResult();
      fs.writeFileSync(filePath, result.css, "utf-8");
      log(`📝 Updated file: ${filePath}`, this.loggingEnabled);
    }

    return removals;
  };
}
