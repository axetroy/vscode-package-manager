import os from "os";
import path from "path";
import fs from "fs";
import execa from "execa";
import which from "which";
import { IPackage, IPackageManager } from "./interface";

interface Dependency {
  [packageName: string]: string;
}

export class PackageManagerYarn implements IPackageManager {
  get name() {
    return "yarn";
  }

  get system(): NodeJS.Platform[] {
    return ["win32", "linux", "darwin"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("yarn");
      return true;
    } catch {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("yarn", ["-v"]);

    return ps.stdout.trim();
  }

  public async updateSelf(): Promise<string> {
    return "yarn self-update";
  }

  public async packages(): Promise<IPackage[]> {
    const globalDirOs = {
      win32: path.join(process.env.LOCALAPPDATA || "", "Yarn", "config", "global"),
      darwin: os.homedir() + "/.config/yarn/global",
      linux: "/usr/local/share/.config/yarn/global",
    };

    // @ts-expect-error ignore
    const globalDir = globalDirOs[os.platform()] as string;

    if (!globalDir) return [];

    const globalPackageFile = path.join(globalDir, "package.json");

    if (!fs.existsSync(globalPackageFile)) return [];

    const jsonContent = fs.readFileSync(globalPackageFile, { encoding: "utf-8" });

    const dependencies = (JSON.parse(jsonContent) as { dependencies: Dependency }).dependencies;

    const deps = Object.keys(dependencies);

    const packages: IPackage[] = [];

    for (const depName of deps) {
      const version = dependencies[depName];

      packages.push({
        package: this.name,
        name: depName,
        version: version.replace(/^(\^|~)/, ""),
        desc: "",
      });
    }

    return packages;
  }

  public async install(packageName: string, version: string): Promise<string> {
    return `yarn global add ${packageName + (version ? `@${version}` : "")}`;
  }

  public async uninstall(packageName: string, oldVersion: string): Promise<string> {
    return `yarn global remove ${packageName}`;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string): Promise<string> {
    return `yarn global upgrade ${packageName + (newVersion ? "@" + newVersion : "")}`;
  }
}
