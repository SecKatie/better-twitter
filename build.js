import { readFileSync, writeFileSync } from "fs";
import { build } from "esbuild";
import { generate } from "userscript-metadata-generator";
import cssnano from "cssnano";
import postcss from "postcss";
import { optimize } from "svgo";

const metadata = {
  name: "Twitter Nuke Button",
  version: "0.4.0",
  author: {
    name: "Katie Mulliken",
    email: "katie@mulliken.net",
  },
  description:
    "Block the author of a bad tweet and all users who liked it using twtools.eu",
  match: ["https://twitter.com/*"],
  grant: ["GM_addStyle"],
};

const buildConfig = {
  entryPoints: ["src/twitter-nuke-button.ts"],
  outfile: "dist/twitter-nuke-button.user.js",
  bundle: true,
  loader: { ".ts": "ts" },
  minify: true,
};

build(buildConfig)
  .then(() => {
    const output = readFileSync(buildConfig.outfile, "utf8");
    const metadataString = generate(metadata);

    const missileSvg = readFileSync("src/missile.svg", "utf8");
    let optimizedMissileSvg = optimize(missileSvg, {
      plugins: [
        { name: "removeViewBox", active: false },
        { name: "removeDimensions", active: true },
        { name: "convertShapeToPath", active: false },
      ],
    });
    const cssFile = readFileSync("src/twitter-nuke-button.css", "utf8");
    postcss([cssnano])
      .process(cssFile, { from: undefined })
      .then((minifiedCss) => {
        writeFileSync(
          buildConfig.outfile,
          `${metadataString}\n\nconst css = \`\n${minifiedCss}\n\`;\nconst missleSvg = \`\n${optimizedMissileSvg.data}\n\`;\n${output}`
        );
      });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
