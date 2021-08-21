import execa from "execa";
import which from "which";

import { IActionOptions, IPackage, IPackageManager } from "./interface";

interface NPMPackage {
  version: string;
  from?: string;
  dependencies?: Dependency[];
}

interface Dependency {
  [packageName: string]: NPMPackage;
}

export class PackageManagerNPM implements IPackageManager {
  get name() {
    return "yarn";
  }

  public async detect(): Promise<boolean> {
    try {
      await which("yarn");
      return true;
    } catch {
      return false;
    }
  }

  public async packages(): Promise<IPackage[]> {
    const ps = await execa("yarn", ["global", "list", "--depth=1"]);

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

  public async install(packageName: string, version: string, options: IActionOptions): Promise<void> {
    const ps = execa("yarn", ["global", "add", packageName + (version ? "@" + version : ""), "-g"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async uninstall(packageName: string, oldVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("yarn", ["global", "remove", packageName + (oldVersion ? "@" + oldVersion : ""), "-g"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("yarn", ["global", "update", packageName + (newVersion ? "@" + newVersion : ""), "-g"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }
}
