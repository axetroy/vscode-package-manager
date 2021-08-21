import { Writable } from "stream";
import { CancellationToken } from "vscode";

export interface IPackage {
  package: string; // 包类型
  name: string; // 包名称
  version: string; // 包版本
  parent?: IPackage;

  desc?: string;
  children?: IPackage[];
}

export interface IActionOptions {
  writer: Writable; // 日志输出的地方
  cancelToken: CancellationToken; // 取消
}

export interface IPackageManager {
  /**
   * 包管理器的名称
   */
  readonly name: string;
  /**
   * 检测包管理器是否存在
   */
  detect(): Promise<boolean>;
  /**
   * 获取包
   */
  packages(): Promise<IPackage[]>;
  /**
   * 安装
   */
  install(packageName: string, version: string, options: IActionOptions): Promise<void>;
  /**
   * 卸载包
   */
  uninstall(packageName: string, oldVersion: string, options: IActionOptions): Promise<void>;
  /**
   * 更新包
   */
  update(packageName: string, oldVersion: string, newVersion: string, options: IActionOptions): Promise<void>;
}
