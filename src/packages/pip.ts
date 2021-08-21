import execa from "execa";
import which from "which";

import { IActionOptions, IPackage, IPackageManager } from "./interface";

interface PIPPackage {
  name: string;
  version: string;
}

export class PackageManagerPIP implements IPackageManager {
  get name() {
    return "pip";
  }

  get system(): NodeJS.Platform[] {
    return ["win32", "linux", "darwin"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("pip");
      return true;
    } catch {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("pip", ["--version"]);

    // pip 19.3.1 from /usr/local/lib/python2.7/site-packages/pip (python 2.7)
    const stdout = ps.stdout.trim();

    const matcher = /^pip\s([^\s]+)\b/.exec(stdout);

    if (!matcher) {
      return "";
    }

    return matcher[1] || "";
  }

  public async updateSelf(options: IActionOptions): Promise<void> {
    const ps = execa("pip", ["install", "--upgrade", "pip"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async packages(): Promise<IPackage[]> {
    const ps = await execa("pip", ["list", "--format", "json"]);

    const dependencies = JSON.parse(ps.stdout) as PIPPackage[];

    return dependencies.map((v) => {
      return {
        package: this.name,
        ...v,
      };
    });
  }

  public async install(packageName: string, version: string, options: IActionOptions): Promise<void> {
    const ps = execa("pip", ["install", packageName + (version ? "@" + version : "")]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async uninstall(packageName: string, oldVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("pip", ["uninstall", packageName, "--yes"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("pip", ["install", packageName + (newVersion ? "@" + newVersion : "")]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }
}
