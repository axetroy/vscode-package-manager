export interface IPackage {
  package: string; // the package manager name of this package
  name: string; // package name
  version: string; // package version
  parent?: IPackage; // the parent package

  desc?: string; // package description
  children?: IPackage[]; // the children of this package
}

export interface IPackageManager {
  /**
   * the package name
   */
  readonly name: string;

  /**
   * the package manager will be used in the systems
   * @requires {NodeJS.Platform[]} The system that the package will be used
   */
  readonly system: NodeJS.Platform[];

  /**
   * detect the package is installed ot not
   * @returns {boolean} Whether the package manger is installed in the computer
   */
  detect(): Promise<boolean>;

  /**
   * get the version of this package manager
   * @returns {string} The version of this package manager
   */
  version(): Promise<string>;

  /**
   * get the packages which has been installed in the local system
   */
  packages(): Promise<IPackage[]>;

  /**
   * upgrade the package manager
   * @requires {string} the command to update package self
   */
  updateSelf(): Promise<string>;

  /**
   * install package
   * @requires {string} the command to install package
   */
  install(packageName: string, version: string): Promise<string>;

  /**
   * uninstall package
   * @requires {string} the command to uninstall package
   */
  uninstall(packageName: string, oldVersion: string): Promise<string>;

  /**
   * update package
   * @requires {string} the command to update package
   */
  update(packageName: string, oldVersion: string, newVersion: string): Promise<string>;
}
