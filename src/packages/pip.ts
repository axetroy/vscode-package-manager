import execa from "execa";
import which from "which";
import { IPackage, IPackageManager } from "./interface";

export class PackageManagerPIP implements IPackageManager {
  get name() {
    return "pip";
  }

  get system(): NodeJS.Platform[] {
    return ["win32", "linux", "darwin"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("pip");
      return true;
    } catch {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("pip", ["--version"]);

    // pip 19.3.1 from /usr/local/lib/python2.7/site-packages/pip (python 2.7)
    const stdout = ps.stdout.trim();

    const matcher = /^pip\s([^\s]+)\b/.exec(stdout);

    if (!matcher) {
      return "";
    }

    return matcher[1] || "";
  }

  public async updateSelf(): Promise<string> {
    return "pip install --upgrade pip";
  }

  public async packages(): Promise<IPackage[]> {
    interface PIPPackage {
      name: string;
      version: string;
    }

    const ps = await execa("pip", ["list", "--format", "json"]);

    const dependencies = JSON.parse(ps.stdout) as PIPPackage[];

    return dependencies.map((v) => {
      return {
        package: this.name,
        ...v,
      };
    });
  }

  public async install(packageName: string, version: string): Promise<string> {
    return `pip install ${packageName + (version ? `@${version}` : "")}`;
  }

  public async uninstall(packageName: string, oldVersion: string): Promise<string> {
    return `pip uninstall ${packageName} --yes`;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string): Promise<string> {
    return `pip install ${packageName + (newVersion ? "@" + newVersion : "")}`;
  }
}
