import * as fs from "fs";
import * as path from "path";
import inquirer from "inquirer";
import fg from "fast-glob";
import postcss, { Root, Rule, AtRule } from "postcss";
import scss from "postcss-scss";

interface EmptySelectorInfo {
  filePath: string;
  selector: string;
  line: number;
}

interface RemovalInfo extends EmptySelectorInfo {}

function log(message: string, loggingEnabled: boolean): void {
  if (loggingEnabled) console.log(message);
}

async function getDirectory(): Promise<string> {
  const { hasScss } = await inquirer.prompt([
    {
      type: "confirm",
      name: "hasScss",
      message: "Are SCSS files in this directory?",
      default: true,
    },
  ]);

  if (hasScss) {
    return process.cwd();
  } else {
    const { dir } = await inquirer.prompt([
      {
        type: "input",
        name: "dir",
        message: "Please provide the directory path:",
        validate: (input: string) => {
          if (fs.existsSync(input) && fs.lstatSync(input).isDirectory()) {
            return true;
          }
          return "Please provide a valid directory path.";
        },
      },
    ]);
    return path.resolve(dir);
  }
}

async function getOptions(): Promise<{
  backupsEnabled: boolean;
  loggingEnabled: boolean;
}> {
  const { backupsEnabled, loggingEnabled } = await inquirer.prompt([
    {
      type: "confirm",
      name: "backupsEnabled",
      message: "Do you want to create backups for each modified file?",
      default: false,
    },
    {
      type: "confirm",
      name: "loggingEnabled",
      message: "Do you want to enable logging?",
      default: true,
    },
  ]);

  return { backupsEnabled, loggingEnabled };
}

async function findScssFiles(dir: string): Promise<string[]> {
  const pattern = path.join(dir, "**/*.scss").replace(/\\/g, "/");
  const entries = await fg([pattern], { dot: true });
  return entries;
}

async function processScssFile(
  filePath: string,
  loggingEnabled: boolean,
  backupsEnabled: boolean
): Promise<RemovalInfo[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const ast: Root = scss.parse(content, { from: filePath });

  const removals: RemovalInfo[] = [];

  let hasChanges = false;

  function processRules(node: postcss.Container) {
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
  }

  processRules(ast);

  if (hasChanges) {
    if (backupsEnabled) {
      const backupPath = `${filePath}.bak`;
      fs.copyFileSync(filePath, backupPath);
      log(`📂 Backup created at: ${backupPath}`, loggingEnabled);
    }

    const result = ast.toResult();
    fs.writeFileSync(filePath, result.css, "utf-8");
    log(`📝 Updated file: ${filePath}`, loggingEnabled);
  }

  return removals;
}

async function main() {
  console.log("🧹 SCSS Cleaner Tool");

  const targetDir = await getDirectory();
  const { backupsEnabled, loggingEnabled } = await getOptions();

  log(`\n🔍 Searching for .scss files in: ${targetDir}`, loggingEnabled);
  const scssFiles = await findScssFiles(targetDir);

  if (scssFiles.length === 0) {
    log("❌ No .scss files found in the specified directory.", loggingEnabled);
    return;
  }

  log(`Found ${scssFiles.length} .scss file(s).\n`, loggingEnabled);

  const allRemovals: RemovalInfo[] = [];

  for (const file of scssFiles) {
    log(`Processing file: ${file}`, loggingEnabled);
    const removals = await processScssFile(
      file,
      loggingEnabled,
      backupsEnabled
    );
    if (removals.length > 0) {
      allRemovals.push(...removals);
    }
  }

  if (allRemovals.length === 0) {
    log("✅ No empty selectors found!", loggingEnabled);
    return;
  }

  log("\n🚫 Removed empty selectors:\n", loggingEnabled);

  allRemovals.forEach((info) => {
    log(`File: ${info.filePath}`, loggingEnabled);
    log(`  Selector: ${info.selector}`, loggingEnabled);
    log(`  Line: ${info.line}\n`, loggingEnabled);
  });

  log("🎉 Cleanup complete!", loggingEnabled);
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
