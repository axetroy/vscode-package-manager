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
    return "npm";
  }

  public async detect(): Promise<boolean> {
    try {
      await which("npm");
      return true;
    } catch (err) {
      console.error(err);
      console.log(process.env.PATH);
      return false;
    }
  }

  public async packages(): Promise<IPackage[]> {
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

  public async install(packageName: string, version: string, options: IActionOptions): Promise<void> {
    const ps = execa("npm", ["install", packageName + (version ? `@${version}` : ""), "-g"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async uninstall(packageName: string, oldVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("npm", ["uninstall", packageName, "-g"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("npm", ["install", packageName + (newVersion ? `@${newVersion}` : ""), "-g"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }
}
