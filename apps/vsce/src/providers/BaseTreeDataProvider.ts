import * as vscode from "vscode";

export abstract class BaseTreeDataProvider<T extends vscode.TreeItem>
	implements vscode.TreeDataProvider<T>
{
	protected _onDidChangeTreeData = new vscode.EventEmitter<T | undefined>();
	readonly onDidChangeTreeData: vscode.Event<T | undefined> =
		this._onDidChangeTreeData.event;

	public refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	public getTreeItem(element: T): vscode.TreeItem {
		return element;
	}

	public abstract getChildren(element?: T): Promise<T[]>;
}
