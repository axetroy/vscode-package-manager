import { Writable } from "stream";
import { CancellationToken } from "vscode";

export interface IPackage {
  package: string; // the package manager name of this package
  name: string; // package name
  version: string; // package version
  parent?: IPackage; // the parent package

  desc?: string; // package description
  children?: IPackage[]; // the children of this package
}

export interface IActionOptions {
  writer: Writable; // the logger writer
  cancelToken: CancellationToken; // cancen token
}

export interface IPackageManager {
  /**
   * the package name
   */
  readonly name: string;

  /**
   * the package manager will be used in the systems
   */
  readonly system: NodeJS.Platform[];

  /**
   * detect the package is installed ot not
   */
  detect(): Promise<boolean>;

  /**
   * get the version of this package manager
   */
  version(): Promise<string>;

  /**
   * get the packages which has been installed in the local system
   */
  packages(): Promise<IPackage[]>;

  /**
   * upgrade the package manager
   */
  updateSelf(options: IActionOptions): Promise<void>;

  /**
   * install package
   */
  install(packageName: string, version: string, options: IActionOptions): Promise<void>;

  /**
   * uninstall package
   */
  uninstall(packageName: string, oldVersion: string, options: IActionOptions): Promise<void>;

  /**
   * update package
   */
  update(packageName: string, oldVersion: string, newVersion: string, options: IActionOptions): Promise<void>;
}
