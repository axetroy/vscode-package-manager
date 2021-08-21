import * as vscode from "vscode";
import Container, { Service } from "typedi";
import * as i18n from "vscode-nls-i18n";
import { IPackageManager, IPackage } from "./packages/interface";
import { TreeProvider } from "./TreeView";

const ErrPackageNotFound = (packageName: string) => `can not found package '${packageName}'`;

@Service()
export class PackageManager {
  #packages: IPackageManager[] = [];

  public async registry(pkg: IPackageManager): Promise<void> {
    if (!pkg.system.includes(process.platform)) return;

    const isExist = await pkg.detect();

    if (isExist) {
      this.#packages.push(pkg);
    }
  }

  public getRegistries(): IPackageManager[] {
    return this.#packages;
  }

  public async getDependencies(packageName: string): Promise<IPackage[]> {
    const manager = this.#packages.find((v) => v.name === packageName);

    if (!manager) return [];

    return manager.packages();
  }

  public refreshTree(item?: IPackage) {
    const treeView = Container.get(TreeProvider);

    treeView.refresh(item);
  }

  private async _createContext(title: string, cb: (cancelToken: vscode.CancellationToken) => Promise<boolean>) {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: true,
      },
      async (progress, cancelToken) => {
        return cb(cancelToken);
      }
    );
  }

  private async _createTask(command: string, cancelToken: vscode.CancellationToken) {
    const task = new vscode.Task(
      {
        type: "shell",
      },
      vscode.TaskScope.Workspace,
      "Package Manager",
      "Package Manager",
      new vscode.ShellExecution(command)
    );

    const taskExecution = await vscode.tasks.executeTask(task);

    cancelToken.onCancellationRequested(() => taskExecution.terminate());

    const taskEndPromise = new Promise<void>((resolve, reject) => {
      const disposable = vscode.tasks.onDidEndTaskProcess((e) => {
        if (e.execution === taskExecution) {
          disposable.dispose();

          if (e.exitCode) {
            reject(e.exitCode);
          }

          resolve();
        }
      });
    });

    await taskEndPromise;
  }

  public async upgradeSelf(item: IPackage) {
    const packageManager = this.#packages.find((v) => v.name === item.package);

    if (!packageManager) {
      vscode.window.showErrorMessage(ErrPackageNotFound(item.package));
      return;
    }

    const pkgName = item.name + (item.version ? `@${item.version}` : "");

    await this._createContext(i18n.localize("upgrade.doing", pkgName), async (cancelToken) => {
      const commands = await packageManager.updateSelf();

      await this._createTask(commands, cancelToken);

      this.refreshTree(item.parent);

      return true;
    });
  }

  public async install(item: IPackage) {
    const inputBox = vscode.window.createInputBox();
    inputBox.title = i18n.localize("install.title", item.package);
    inputBox.totalSteps = 2;
    inputBox.step = 1;
    inputBox.placeholder = i18n.localize("install.packageName");
    inputBox.prompt = i18n.localize("install.packageName.placeholder", item.package);

    const result = {
      packageName: "",
      version: "",
    };

    try {
      await new Promise<typeof result>((resolve, reject) => {
        inputBox.onDidChangeValue((e) => {
          if (inputBox.value) {
            inputBox.validationMessage = "";
          }
        });
        inputBox.onDidAccept((e) => {
          switch (inputBox.step) {
            case 1:
              if (!inputBox.value) {
                inputBox.validationMessage = i18n.localize("install.packageName.placeholder", item.package);
                return;
              }
              result.packageName = inputBox.value;
              inputBox.placeholder = i18n.localize("install.packageVersion.placeholder");
              inputBox.prompt = i18n.localize("install.packageVersion.prompt", result.packageName);
              inputBox.value = "";
              inputBox.step++;
              break;
            case 2:
              result.version = inputBox.value;
              resolve(result);
              inputBox.dispose();
              break;
          }
        });

        inputBox.onDidHide(() => {
          inputBox.dispose();
          if (Object.values(result).every((v) => !!v)) {
            resolve(result);
          } else {
            reject();
          }
        });

        inputBox.show();
      });
    } catch {
      return;
    }

    const packageManager = this.#packages.find((v) => v.name === item.package);

    if (!packageManager) {
      vscode.window.showErrorMessage(ErrPackageNotFound(item.package));
      return;
    }

    const pkgName = result.packageName + (result.version ? "@" + result.version : "");

    await this._createContext(i18n.localize("install.doing", pkgName), async (cancelToken) => {
      const commands = await packageManager.install(result.packageName, result.version);

      await this._createTask(commands, cancelToken);

      this.refreshTree(item.parent);

      return true;
    });
  }

  public async uninstall(item: IPackage) {
    const packageManager = this.#packages.find((v) => v.name === item.package);

    if (!packageManager) {
      vscode.window.showErrorMessage(ErrPackageNotFound(item.package));
      return;
    }

    const pkgName = item.name + (item.version ? `@${item.version}` : "");

    await this._createContext(i18n.localize("uninstall.doing", pkgName), async (cancelToken) => {
      const commands = await packageManager.uninstall(item.name, item.version);

      await this._createTask(commands, cancelToken);

      this.refreshTree(item.parent);

      return true;
    });
  }

  public async update(item: IPackage) {
    const packageManager = this.#packages.find((v) => v.name === item.package);

    if (!packageManager) {
      vscode.window.showErrorMessage(ErrPackageNotFound(item.package));
      return;
    }

    await this._createContext(i18n.localize("update.doing", item.name), async (cancelToken) => {
      const commands = await packageManager.update(item.name, item.version, "");

      await this._createTask(commands, cancelToken);

      this.refreshTree(item.parent);

      return true;
    });
  }
}
