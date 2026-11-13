import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

export function activate(context) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	// const disposable = vscode.commands.registerCommand('bookmark-code.helloWorld', function () {
	// 	// The code you place here will be executed every time your command is executed
		
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from bookmark_code!');
	// });

	const bookmarkProvider = new BookmarkProvider(context);
	
	const DecorationType = vscode.window.createTextEditorDecorationType({
		gutterIconPath:'C:\/vscode_work\/vscode_ext\/bookmark-code\/icons\/bookmark-filled-disabled.svg'
		// overviewRulerColor,
		// overviewerRulerLane,
	})

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations(){
		if(!activeEditor){
			return;
		}
		const decorationRanges = [
			new vscode.Range(0,0,0,0)
		];
		activeEditor.setDecorations(DecorationType, decorationRanges)
		// updateDecorationsInActiveEditor(
		// 	bookmarkDecorationType
		// );
	}

	updateDecorations();

	context.subscriptions.push(disposable, DecorationType);
}

class BookmarkProvider{
	// _onDidChangeTreeData= new vscode.EventEmitter();
	// onDidChangeTreeData = this._onDidChangeTreeData.event;
}

// This method is called when your extension is deactivated
export function deactivate() {}
