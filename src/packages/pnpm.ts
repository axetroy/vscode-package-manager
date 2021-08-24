import execa from "execa";
import which from "which";
import { IPackage, IPackageManager } from "./interface";

export class PackageManagerPNPM implements IPackageManager {
  get name() {
    return "pnpm";
  }

  get system(): NodeJS.Platform[] {
    return ["win32", "linux", "darwin"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("pnpm");
      return true;
    } catch (err) {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("pnpm", ["-v"]);

    return ps.stdout.trim();
  }

  public async updateSelf(): Promise<string> {
    return `pnpm install pnpm --global`;
  }

  public async packages(): Promise<IPackage[]> {
    interface PNPMPackage {
      from?: string;
      version: string;
    }

    interface Dependency {
      [packageName: string]: PNPMPackage;
    }

    const ps = await execa("pnpm", ["list", "--global", "--json", "--no-color", "--depth", "0"]);

    if (!ps.stdout) return [];

    interface Output {
      path: string;
      dependencies?: Dependency;
    }

    const dependencies = JSON.parse(ps.stdout) as Output[];

    if (!dependencies.length) return [];
    if (!dependencies[0].dependencies) return [];

    const deps = Object.keys(dependencies[0].dependencies);

    const packages: IPackage[] = [];

    for (const depName of deps) {
      const dep = dependencies[0].dependencies[depName];

      packages.push({
        package: this.name,
        name: depName,
        version: dep.version,
        desc: "",
      });
    }

    return packages;
  }

  public async install(packageName: string, version: string): Promise<string> {
    return `pnpm install ${packageName + (version ? `@${version}` : "")} --global`;
  }

  public async uninstall(packageName: string, oldVersion: string): Promise<string> {
    return `pnpm uninstall ${packageName} --global`;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string): Promise<string> {
    return `pnpm add ${packageName + (newVersion ? `@${newVersion}` : "")} --global`;
  }
}
