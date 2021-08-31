import execa from "execa";
import which from "which";
import { IPackage, IPackageManager } from "./interface";

export class PackageManagerApt implements IPackageManager {
  get name() {
    return "apt";
  }

  get system(): NodeJS.Platform[] {
    return ["linux"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("apt");
      return true;
    } catch {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("apt", ["-v"]);

    return ps.stdout.trim();
  }

  public async updateSelf(): Promise<string> {
    return "apt update";
  }

  public async packages(): Promise<IPackage[]> {
    const ps = await execa("apt", ["list", "--installed"]);

    const dependencies = ps.stdout
      .split("\n")
      .filter((v) => v.trim())
      .filter((v) => /(\w-)+\s\([^\)]+\)/)
      .map((v) => {
        const reg = /([\w-]+)\s\((default:\s)?([\d\.]+)\)/;

        const matcher = reg.exec(v);

        if (!matcher) return;

        const pkg: IPackage = {
          package: this.name,
          name: matcher[1],
          version: matcher[3],
        };

        return pkg;
      })
      .filter((v) => v) as IPackage[];

    return dependencies;
  }

  public async install(packageName: string, version: string): Promise<string> {
    return `gem install ${packageName + (version ? `:${version}` : "")}`;
  }

  public async uninstall(packageName: string, oldVersion: string): Promise<string> {
    return `gem uninstall ${packageName + (oldVersion ? `:${oldVersion}` : "")} --executables --abort-on-dependent --ignore-dependencies --verbose`;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string): Promise<string> {
    return `gem update ${packageName + (newVersion ? `:${newVersion}` : "")}`;
  }
}
