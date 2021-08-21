import exec from "execa";
import which from "which";
import { IActionOptions, IPackage, IPackageManager } from "./interface";

interface BrewPackage {
  name: string;
  versions: { stable: string; head?: string; bottle: boolean };
  desc: string;
  homepage: string;
}

export class PackageManagerHomeBrew implements IPackageManager {
  get name() {
    return "homebrew";
  }

  public async detect(): Promise<boolean> {
    try {
      await which("brew");
      return true;
    } catch {
      return false;
    }
  }

  public async packages(): Promise<IPackage[]> {
    const output = await exec("brew", ["info", "--json=v1", "--installed"]);

    const deps = JSON.parse(output.stdout) as BrewPackage[];

    return deps.map((v) => {
      return {
        package: this.name,
        name: v.name,
        version: v.versions.stable,
        desc: v.desc,
      };
    });
  }

  public async install(packageName: string, version: string, options: IActionOptions): Promise<void> {
    const ps = exec("brew", ["install", packageName + (version ? "@" + version : "")]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async uninstall(packageName: string, oldVersion: string, options: IActionOptions): Promise<void> {
    const ps = exec("brew", ["uninstall", packageName]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string, options: IActionOptions): Promise<void> {
    const ps = exec("brew", ["upgrade", packageName]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }
}
