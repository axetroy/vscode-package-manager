import execa from "execa";
import which from "which";
import { IPackage, IPackageManager } from "./interface";

export class PackageManagerPIP3 implements IPackageManager {
  get name() {
    return "pip3";
  }

  get system(): NodeJS.Platform[] {
    return ["win32", "linux", "darwin"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("pip3");
      return true;
    } catch {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("pip3", ["--version"]);

    // pip 21.0.1 from /usr/local/lib/python3.9/site-packages/pip (python 3.9)
    const stdout = ps.stdout.trim();

    const matcher = /^pip\s([^\s]+)\b/.exec(stdout);

    if (!matcher) {
      return "";
    }

    return matcher[1] || "";
  }

  public async updateSelf(): Promise<string> {
    return "pip3 install --upgrade pip3";
  }

  public async packages(): Promise<IPackage[]> {
    interface PIP3Package {
      name: string;
      version: string;
    }

    const ps = await execa("pip3", ["list", "--format", "json"]);

    const dependencies = JSON.parse(ps.stdout) as PIP3Package[];

    return dependencies.map((v) => {
      return {
        package: this.name,
        ...v,
      };
    });
  }

  public async install(packageName: string, version: string): Promise<string> {
    return `pip3 install ${packageName + (version ? `@${version}` : "")}`;
  }

  public async uninstall(packageName: string, oldVersion: string): Promise<string> {
    return `pip3 uninstall ${packageName} --yes`;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string): Promise<string> {
    return `pip3 install ${packageName + (newVersion ? "@" + newVersion : "")} --yes`;
  }
}
