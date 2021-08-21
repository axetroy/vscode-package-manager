import { Writable, WritableOptions } from "stream";
import * as vscode from "vscode";

export class Logger extends Writable implements vscode.Disposable {
  #data: string = "";

  constructor(options?: WritableOptions) {
    super(options);
  }

  public async show() {
    const doc = await vscode.workspace.openTextDocument({
      language: "txt",
      content: this.#data,
    });

    await vscode.window.showTextDocument(doc);
  }

  public dispose() {
    this.#data = "";
    if (!this.destroyed) {
      this.dispose();
    }
  }

  public _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.#data += chunk.toString();
    callback();
  }
}
