import execa from "execa";
import which from "which";
import { IPackage, IPackageManager } from "./interface";

export class PackageManagerChocolatey implements IPackageManager {
  get name() {
    return "Chocolatey";
  }

  get system(): NodeJS.Platform[] {
    return ["win32"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("choco");
      return true;
    } catch {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("choco", ["-v"]);

    return ps.stdout.trim();
  }

  public async updateSelf(): Promise<string> {
    return "choco upgrade chocolatey";
  }

  public async packages(): Promise<IPackage[]> {
    // Example:

    // chocolatey|0.10.15
    // deno|1.13.2
    const ps = await execa("choco", ["list", "--local-only", "--no-color", "--no-progress", "--limitoutput", "--yes"]);

    const dependencies = ps.stdout
      .split("\n")
      .filter((v) => v.trim())
      .filter((v) => /(\w-)+\s\([^\)]+\)/)
      .map((v) => {
        const [packageName, version] = v.split("|");

        const pkg: IPackage = {
          package: this.name,
          name: packageName,
          version: version,
        };

        return pkg;
      })
      .filter((v) => v) as IPackage[];

    return dependencies;
  }

  public async install(packageName: string, version: string): Promise<string> {
    return `choco install ${packageName} ${version ? `--version ${version}` : ""} --yes`;
  }

  public async uninstall(packageName: string, oldVersion: string): Promise<string> {
    return `choco uninstall ${packageName} ${oldVersion ? `--version ${oldVersion}` : ""} --yes`;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string): Promise<string> {
    return `choco upgrade ${packageName} ${newVersion ? `--version ${newVersion}` : ""} --yes`;
  }
}
