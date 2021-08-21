import execa from "execa";
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

  get system(): NodeJS.Platform[] {
    return ["linux", "darwin"];
  }

  public async detect(): Promise<boolean> {
    try {
      await which("brew");
      return true;
    } catch {
      return false;
    }
  }

  public async version(): Promise<string> {
    const ps = await execa("brew", ["-v"]);

    // Homebrew 3.0.2
    // Homebrew/homebrew-core (git revision ef9b; last commit 2021-02-23)
    // Homebrew/homebrew-cask (git revision f3212; last commit 2021-02-23)
    const stdout = ps.stdout.trim();

    const matcher = /^Homebrew\s(.+)/.exec(stdout);

    if (!matcher) {
      return "";
    }

    return matcher[1] || "";
  }

  public async updateSelf(options: IActionOptions): Promise<void> {
    const ps = execa("brew", ["upgrade"]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async packages(): Promise<IPackage[]> {
    const output = await execa("brew", ["info", "--json=v1", "--installed"]);

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
    const ps = execa("brew", ["install", packageName + (version ? "@" + version : "")]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async uninstall(packageName: string, oldVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("brew", ["uninstall", packageName]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }

  public async update(packageName: string, oldVersion: string, newVersion: string, options: IActionOptions): Promise<void> {
    const ps = execa("brew", ["upgrade", packageName]);

    options.cancelToken.onCancellationRequested(() => ps.cancel());

    ps.stdout?.pipe(options.writer);
    ps.stderr?.pipe(options.writer);

    await ps;
  }
}
