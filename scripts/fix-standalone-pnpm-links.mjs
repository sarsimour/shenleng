import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const sourceNodeModules = path.join(projectRoot, "node_modules");
const standaloneNodeModules = path.join(standaloneRoot, "node_modules");
const sourcePnpm = path.join(sourceNodeModules, ".pnpm");

function pathExists(filePath) {
  try {
    fs.lstatSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function packageFolderPrefix(packageName) {
  return packageName.replace("/", "+");
}

function findPnpmPackageFolder(packageName) {
  const prefix = `${packageFolderPrefix(packageName)}@`;
  return fs
    .readdirSync(sourcePnpm)
    .find((entry) => entry === packageFolderPrefix(packageName) || entry.startsWith(prefix));
}

function packagePath(packageName) {
  return path.join(...packageName.split("/"));
}

function mirrorSymlink(relativePath) {
  const source = path.join(projectRoot, relativePath);

  if (!pathExists(source) || !fs.lstatSync(source).isSymbolicLink()) {
    return false;
  }

  const destination = path.join(standaloneRoot, relativePath);
  const target = fs.readlinkSync(source);
  const resolvedTarget = path.resolve(path.dirname(destination), target);

  if (!pathExists(resolvedTarget)) {
    return false;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.rmSync(destination, { recursive: true, force: true });
  fs.symlinkSync(target, destination, process.platform === "win32" ? "junction" : "dir");

  return true;
}

function mirrorTopLevelPackage(packageName) {
  return mirrorSymlink(path.join("node_modules", packagePath(packageName)));
}

function mirrorNestedDependency(parentPackageName, dependencyPackageName) {
  const parentFolder = findPnpmPackageFolder(parentPackageName);
  if (!parentFolder) {
    return false;
  }

  return mirrorSymlink(
    path.join(
      "node_modules",
      ".pnpm",
      parentFolder,
      "node_modules",
      packagePath(dependencyPackageName),
    ),
  );
}

if (!pathExists(standaloneNodeModules)) {
  console.log("[standalone-links] No standalone node_modules found; skipping.");
  process.exit(0);
}

if (!pathExists(sourcePnpm)) {
  console.log("[standalone-links] pnpm layout not detected; skipping.");
  process.exit(0);
}

let mirrored = [
  mirrorTopLevelPackage("libsql"),
  mirrorTopLevelPackage("@libsql/client"),
  mirrorNestedDependency("@libsql/client", "@libsql/core"),
  mirrorNestedDependency("@libsql/client", "@libsql/hrana-client"),
  mirrorNestedDependency("@libsql/client", "libsql"),
  mirrorNestedDependency("@libsql/client", "promise-limit"),
  mirrorNestedDependency("@libsql/core", "js-base64"),
  mirrorNestedDependency("@libsql/hrana-client", "@libsql/isomorphic-fetch"),
  mirrorNestedDependency("@libsql/hrana-client", "@libsql/isomorphic-ws"),
  mirrorNestedDependency("@libsql/hrana-client", "js-base64"),
  mirrorNestedDependency("@libsql/hrana-client", "node-fetch"),
  mirrorNestedDependency("@libsql/isomorphic-ws", "ws"),
  mirrorNestedDependency("libsql", "@neon-rs/load"),
  mirrorNestedDependency("libsql", "detect-libc"),
].filter(Boolean).length;

const libsqlFolder = findPnpmPackageFolder("libsql");
if (libsqlFolder) {
  const libsqlLibDir = path.join(
    "node_modules",
    ".pnpm",
    libsqlFolder,
    "node_modules",
    "@libsql",
  );
  const sourceLibsqlNativeDir = path.join(projectRoot, libsqlLibDir);
  if (pathExists(sourceLibsqlNativeDir)) {
    for (const entry of fs.readdirSync(sourceLibsqlNativeDir)) {
      if (mirrorSymlink(path.join(libsqlLibDir, entry))) {
        mirrored += 1;
      }
    }
  }
}

console.log(`[standalone-links] Mirrored ${mirrored} pnpm symlink(s) into .next/standalone.`);
