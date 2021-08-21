import execa from "execa";
import which from "which";

import { IActionOptions, IPackage, IPackageManager } from "./interface";

interface PIP3Package {
  name: string;
  version: string;
}

export class PackageManagerPIP3 implements IPackageManager {
  get name() {
    return "pip3";
  }

  public async detect(): Promise<boolean> {
    try {
      await which("pip3");
      return true;
    } catch {
      return false;
    }
  }

  public async packages(): Promise<IPackage[]> {
    const ps = await execa("pip3", ["list", "--format", "json"]);

    const dependencies = JSON.parse(ps.stdout) as PIP3Package[];

    return dependencies.map((v) => {
      return {
        package: this.name,
        ...v,
      };
    });
  }

  public async install(packageName: string, version: string, options: IActionOptions): Promise<void> {
    const ps = execa("pip3", ["install", packageName + (version ? "@" + version : "")]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async uninstall(packageName: string, oldVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("pip3", ["uninstall", packageName]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("pip3", ["install", packageName + (newVersion ? "@" + newVersion : "")]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }
}
