import execa from "execa";
import which from "which";
import { IPackage, IPackageManager } from "./interface";

export class PackageManagerNPM implements IPackageManager {
  get name() {
    return "npm";
  }

  get system(): NodeJS.Platform[] {
    return ["win32", "linux", "darwin"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("npm");
      return true;
    } catch (err) {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("npm", ["-v"]);

    return ps.stdout.trim();
  }

  public async updateSelf(): Promise<string> {
    return `npm install ${this.name} -g`;
  }

  public async packages(): Promise<IPackage[]> {
    interface NPMPackage {
      version: string;
      from?: string;
      dependencies?: Dependency[];
    }

    interface Dependency {
      [packageName: string]: NPMPackage;
    }

    const ps = await execa("npm", ["list", "-g", "--json", "--depth=1"]);

    const dependencies = (JSON.parse(ps.stdout) as { dependencies: Dependency }).dependencies;

    const deps = Object.keys(dependencies);

    const packages: IPackage[] = [];

    for (const depName of deps) {
      const dep = dependencies[depName];

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
    return `npm install ${packageName + (version ? `@${version}` : "")} -g`;
  }

  public async uninstall(packageName: string, oldVersion: string): Promise<string> {
    return `npm uninstall ${packageName} -g`;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string): Promise<string> {
    return `npm update ${packageName + (newVersion ? `@${newVersion}` : "")} -g`;
  }
}
