#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let outDir = null;
if (fs.existsSync("tsconfig.json")) {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
  if (!tsconfig.compilerOptions.outDir) {
    tsconfig.compilerOptions.outDir = "dist";
  }
  outDir = tsconfig.compilerOptions.outDir;
  tsconfig.compilerOptions.resolveJsonModule = true;
  tsconfig.compilerOptions.sourceMap = true;
  tsconfig.compilerOptions.noEmit = false;
  fs.writeFileSync("tsconfig.json", JSON.stringify(tsconfig, null, 2));
}
let ide = process.argv[2];
if (!ide) {
  ide = process.env.TERM_PROGRAM;
}
try {
  const ideScript = await import(`file://${__dirname}/${ide}.js`);
  ideScript.configure(outDir);
} catch (e) {
  console.error(`${ide} is not supported`);
  process.exit(1);
}