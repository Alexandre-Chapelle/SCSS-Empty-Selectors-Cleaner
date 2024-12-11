import * as fs from "fs";
import postcss, {
  Root,
  Rule as PostcssRule,
  Declaration as PostcssDecl,
} from "postcss";
import type { FeatureStartPayload, RemovalInfo } from "../types";
import { log, processFiles } from "../utils";
import { findScssFiles } from "../utils/dir";

export class RefactorTransitions {
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
      log("✅ No unused transitions were found!", loggingEnabled);
      return;
    }

    log("\n🚫 Removed unused transitions:\n", loggingEnabled);

    removals.forEach((info) => {
      log(`File: ${info.filePath}`, loggingEnabled);
      log(`  Selector: ${info.selector}`, loggingEnabled);
      log(`  Line: ${info.line}\n`, loggingEnabled);
    });

    log("🎉 Cleanup complete!", loggingEnabled);
  };

  public processScssFile = async (filePath: string): Promise<RemovalInfo[]> => {
    const content = fs.readFileSync(filePath, "utf-8");
    const ast: Root = postcss.parse(content, { from: filePath });

    const removals: RemovalInfo[] = [];
    let hasChanges = false;

    // TODO:
    // Add prompt for user to specify their allowedProperties
    const allowedProperties = new Set([
      "border",
      "background",
      "background-color",
      "color",
      "outline",
      "box-shadow",
      "opacity",
      "transform",
      "padding",
      "width",
      "height",
      "margin",
      "fill",
      "fill-opacity",
    ]);

    const isPseudoSelector = (selector: string): boolean => {
      return /^&:\w+/.test(selector);
    };

    ast.walkRules((rule: PostcssRule) => {
      const transitionDeclIndex = rule.nodes?.findIndex(
        (node) =>
          node.type === "decl" &&
          node.prop === "transition" &&
          /^all\s+0\.15s$/i.test(node.value.trim())
      );

      if (transitionDeclIndex === undefined || transitionDeclIndex === -1) {
        return;
      }

      const transitionDecl = rule.nodes![transitionDeclIndex] as PostcssDecl;

      const childPseudoRules = rule.nodes?.filter(
        (node) =>
          node.type === "rule" &&
          node.selector &&
          isPseudoSelector(node.selector)
      ) as PostcssRule[] | undefined;

      if (!childPseudoRules || childPseudoRules.length === 0) {
        const line = transitionDecl.source?.start?.line || 0;

        // TODO:
        // - Add prompt for user to specify wheter they want to delete selectors that
        // have transitions but do not have any pseudo classes.
        // - Add prompt for user to specify wheter they have conditionally rendered classes
        // e.g.: user specifies that they have only 1 conditional class: 'active', in that
        // case we check the parent selector to see if it contains this class and if it does
        // than apply the logic of modifying properties there.
        // removals.push({
        //   filePath,
        //   selector: rule.selector,
        //   line,
        // });
        // rule.removeChild(transitionDecl);
        // hasChanges = true;

        log(
          `${filePath} @ "${rule.selector}" -> ${line} | Action should be taken (did not find child pseudo-classes)`,
          this.loggingEnabled
        );
      } else {
        const modifiedProperties = new Set<string>();

        childPseudoRules.forEach((childRule) => {
          childRule.walkDecls((decl: PostcssDecl) => {
            if (allowedProperties.has(decl.prop)) {
              modifiedProperties.add(decl.prop);
            }
          });
        });

        if (modifiedProperties.size === 0) {
          const line = transitionDecl.source?.start?.line || 0;

          // TODO: See line 109
          // removals.push({
          //   filePath,
          //   selector: rule.selector,
          //   line,
          // });
          // rule.removeChild(transitionDecl);
          // hasChanges = true;

          log(
            `${filePath} @ "${rule.selector}" -> \x1b[32m"${line}"\x1b[0m | Action should be taken (no allowed properties modified in pseudo-elements)`,
            this.loggingEnabled
          );
        } else {
          const transitionValues = new Set();
          modifiedProperties.forEach((prop) => {
            const formattedProp =
              prop === "background" ? "background-color" : prop;

            transitionValues.add(formattedProp);
          });
          const arrTransitionVals = Array.from(transitionValues).map(
            (item) => `${item} 0.15s`
          );

          const newTransitionValue = arrTransitionVals.join(", ");

          transitionDecl.value = newTransitionValue;
          hasChanges = true;
          log(
            `[UPDATED] ${filePath} @ "${rule.selector}" transition to "${newTransitionValue}"`,
            this.loggingEnabled
          );
        }
      }
    });

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
