const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "www");
const assets = ["index.html", "budget.css", "budget.js"];

async function main() {
  await fs.mkdir(output, { recursive: true });
  await Promise.all(
    assets.map((file) =>
      fs.copyFile(path.join(root, file), path.join(output, file))
    )
  );
}

main().catch((error) => {
  console.error("Could not copy app files for the Android build:", error);
  process.exitCode = 1;
});
