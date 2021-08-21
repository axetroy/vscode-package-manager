import { window, ProgressLocation, CancellationToken } from "vscode";
import Container, { Service } from "typedi";
import * as i18n from "vscode-nls-i18n";
import { IPackageManager, IPackage } from "./packages/interface";
import { TreeProvider } from "./TreeView";
import { Logger } from "./Logger";
import { ExecaError } from "execa";

const ErrPackageNotFound = (packageName: string) => `can not found package '${packageName}'`;

function showAction(message: string, logger: Logger, actions: { [name: string]: () => Promise<void> }) {
  Object.keys(actions);

  window.showInformationMessage(message, ...Object.keys(actions)).then((actionName) => {
    if (!actionName) {
      logger.dispose();
      return;
    }
    const actionFn = actions[actionName];

    actionFn().finally(() => logger.dispose());
  });
}

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

  private async _createContext(title: string, cb: (logger: Logger, cancelToken: CancellationToken) => Promise<boolean>) {
    const logger = new Logger();

    try {
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title,
          cancellable: true,
        },
        async (progress, cancelToken) => {
          return cb(logger, cancelToken);
        }
      );
    } catch (err) {
      if (err instanceof Error) {
        logger.write(err.message);

        logger.show();
        logger.dispose();
      } else {
        console.error(err);
      }
    }
  }

  public async upgradeSelf(item: IPackage) {
    const packageManager = this.#packages.find((v) => v.name === item.package);

    if (!packageManager) {
      window.showErrorMessage(ErrPackageNotFound(item.package));
      return;
    }

    const pkgName = item.name + (item.version ? `@${item.version}` : "");

    await this._createContext(i18n.localize("upgrade.doing", pkgName), async (logger, cancelToken) => {
      const isCanceled = await packageManager.updateSelf({ writer: logger, cancelToken }).catch((err) => {
        if (err && (err as ExecaError).isCanceled) {
          return Promise.resolve(true);
        } else {
          return Promise.reject(err);
        }
      });

      if (isCanceled) return false;

      this.refreshTree(item.parent);

      showAction(i18n.localize("upgrade.success", pkgName), logger, {
        [i18n.localize("btn.showDetail")]: async () => {
          logger.show();
        },
      });

      return true;
    });
  }

  public async install(item: IPackage) {
    const inputBox = window.createInputBox();
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
      window.showErrorMessage(ErrPackageNotFound(item.package));
      return;
    }

    const pkgName = result.packageName + (result.version ? "@" + result.version : "");

    await this._createContext(i18n.localize("install.doing", pkgName), async (logger, cancelToken) => {
      const isCanceled = await packageManager.install(result.packageName, result.version, { writer: logger, cancelToken }).catch((err) => {
        if (err && (err as ExecaError).isCanceled) {
          return Promise.resolve(true);
        } else {
          return Promise.reject(err);
        }
      });

      if (isCanceled) return false;

      this.refreshTree(item.parent);

      showAction(i18n.localize("install.success", pkgName), logger, {
        [i18n.localize("btn.showDetail")]: async () => {
          logger.show();
        },
      });

      return true;
    });
  }

  public async uninstall(item: IPackage) {
    const packageManager = this.#packages.find((v) => v.name === item.package);

    if (!packageManager) {
      window.showErrorMessage(ErrPackageNotFound(item.package));
      return;
    }

    const pkgName = item.name + (item.version ? `@${item.version}` : "");

    await this._createContext(i18n.localize("uninstall.doing", pkgName), async (logger, cancelToken) => {
      const isCanceled = await packageManager.uninstall(item.name, item.version, { writer: logger, cancelToken }).catch((err) => {
        if (err && (err as ExecaError).isCanceled) {
          return Promise.resolve(true);
        } else {
          return Promise.reject(err);
        }
      });

      if (isCanceled) return false;

      this.refreshTree(item.parent);

      showAction(i18n.localize("uninstall.success", pkgName), logger, {
        [i18n.localize("btn.showDetail")]: async () => {
          logger.show();
        },
      });

      return true;
    });
  }

  public async update(item: IPackage) {
    const packageManager = this.#packages.find((v) => v.name === item.package);

    if (!packageManager) {
      window.showErrorMessage(ErrPackageNotFound(item.package));
      return;
    }

    await this._createContext(i18n.localize("update.doing", item.name), async (logger, cancelToken) => {
      const isCanceled = await packageManager.update(item.name, item.version, "", { writer: logger, cancelToken }).catch((err) => {
        if (err && (err as ExecaError).isCanceled) {
          return Promise.resolve(true);
        } else {
          return Promise.reject(err);
        }
      });

      if (isCanceled) return false;

      this.refreshTree(item.parent);

      showAction(i18n.localize("update.success", item.name), logger, {
        [i18n.localize("btn.showDetail")]: async () => {
          logger.show();
        },
      });

      return true;
    });
  }
}
