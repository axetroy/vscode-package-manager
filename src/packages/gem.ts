import execa from "execa";
import which from "which";

import { IActionOptions, IPackage, IPackageManager } from "./interface";

export class PackageManagerGem implements IPackageManager {
  get name() {
    return "gem";
  }

  get system(): NodeJS.Platform[] {
    return ["win32", "linux", "darwin"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("gem");
      return true;
    } catch {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("gem", ["-v"]);

    return ps.stdout.trim();
  }

  public async updateSelf(options: IActionOptions): Promise<void> {
    const ps = execa("gem", ["update", "--system"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
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
    const ps = execa("gem", ["install", packageName + (version ? `:${version}` : "")]);

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
    const ps = execa("gem", ["update", packageName + (newVersion ? `:${newVersion}` : "")]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }
}
