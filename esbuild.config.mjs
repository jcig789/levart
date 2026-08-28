import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import fs from "fs";
import path from "path";

const prod = process.argv[2] === "production";
const VAULT_PATH = process.env.VAULT_PATH ?? "/Users/john.geronimo/Documents/sanvault";

function deployToVault() {
  const pluginDir = path.join(VAULT_PATH, ".obsidian", "plugins", "levart");
  fs.mkdirSync(pluginDir, { recursive: true });
  for (const file of ["main.js", "styles.css", "manifest.json"]) {
    try {
      fs.copyFileSync(file, path.join(pluginDir, file));
    } catch (e) {
      console.warn(`  Could not copy ${file}: ${e.message}`);
    }
  }
  console.log(`[levart] deployed to ${pluginDir}`);
}

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", ...builtins],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  plugins: [
    {
      name: "deploy-on-rebuild",
      setup(build) {
        build.onEnd(result => {
          if (result.errors.length === 0) deployToVault();
        });
      },
    },
  ],
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
