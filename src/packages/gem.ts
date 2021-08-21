import execa from "execa";
import which from "which";

import { IActionOptions, IPackage, IPackageManager } from "./interface";

export class PackageManagerGem implements IPackageManager {
  get name() {
    return "gem";
  }

  public async detect(): Promise<boolean> {
    try {
      await which("gem");
      return true;
    } catch {
      return false;
    }
  }

  public async packages(): Promise<IPackage[]> {
    const ps = await execa("gem", ["list", "--local"]);

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

  public async install(packageName: string, version: string, options: IActionOptions): Promise<void> {
    const ps = execa("gem", ["install", packageName + (version ? "@" + version : ""), "-g"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async uninstall(packageName: string, oldVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("gem", [
      "uninstall",
      packageName + (oldVersion ? `:${oldVersion}` : ""),
      "--executables",
      "--abort-on-dependent",
      "--ignore-dependencies",
      "--backtrace",
      "--verbose",
    ]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string, options: IActionOptions): Promise<void> {
    return this.install(packageName, newVersion, options);
  }
}
