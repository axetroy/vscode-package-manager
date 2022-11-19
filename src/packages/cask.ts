import execa from "execa";
import which from "which";
import { IPackage, IPackageManager } from "./interface";

export class PackageManagerCask implements IPackageManager {
  get name() {
    return "cask";
  }

  get system(): NodeJS.Platform[] {
    return ["win32", "linux", "darwin"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("cask");
      return true;
    } catch (err) {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("cask", ["--version"]);

    return ps.stdout.trim().split(" ")[1];
  }

  public async updateSelf(): Promise<string> {
    return `cask self-update`;
  }

  public async packages(): Promise<IPackage[]> {
    interface CaskPackage {
      name: string;
      bin: string;
      version: string;
    }

    type Dependency = CaskPackage[];

    const ps = await execa("cask", ["list", "--json"]);

    const dependencies = JSON.parse(ps.stdout) as Dependency;

    const packages: IPackage[] = [];

    for (const dep of dependencies) {
      packages.push({
        package: this.name,
        name: dep.name,
        version: dep.version,
        desc: "",
      });
    }

    return packages;
  }

  public async install(packageName: string, version: string): Promise<string> {
    return `cask install ${packageName} ${version ? version : ""}`;
  }

  public async uninstall(packageName: string, oldVersion: string): Promise<string> {
    return `cask uninstall ${packageName}`;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string): Promise<string> {
    return `cask update ${packageName}`;
  }
}
