import * as vscode from 'vscode';
import * as path from 'path';

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

	// vscode.window.registerTreeDataProvider('bookmarksList', bookmarkProvider);
	
	bookmarkProvider.loadBookmarks();

	// const DecorationType = vscode.window.createTextEditorDecorationType({
	// 	gutterIconPath:'C:\/vscode_work\/vscode_ext\/bookmark-code\/icons\/bookmark-filled-disabled.svg'
	// })

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

    bookmarks = new Map();
    context;
	bookmarkDecoration;

    constructor(context) {
        this.context = context;
        // const iconPath = path.join(this.context.extensionPath, 'resources', 'bookmark.svg');
        this.bookmarkDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath:'C:\/vscode_work\/vscode_ext\/bookmark-code\/icons\/bookmark-filled-disabled.svg'
        });
        this.updateBookmarkContext();
    }
    updateBookmarkContext(){
        const editor = vscode.window.activeTextEditor;
        // if (!editor) {
        //     vscode.commands.executeCommand('setContext', 'bookmarks.hasBookmarkAtCurrentLine', false);
        //     return;
        // }
        const fileKey = editor.document.uri.toString();
        const fileBookmarks = this.bookmarks.get(fileKey) || [];
        const currentLine = editor.selection.active.line; // 0-based cursor position
        const bookmarkedLines = fileBookmarks.map(b => b.line + 1);
        vscode.commands.executeCommand('setContext', 'bookmarks.lines', bookmarkedLines);
    }

    // refresh(){
    //     this._onDidChangeTreeData.fire();
    // }

    loadBookmarks(){
        const stored = this.context.workspaceState.get<{[key: string]: Bookmark[]}>('bookmarks', {});
        this.bookmarks = new Map(Object.entries(stored));
        this.refresh();
		this.updateDecorations();
        this.updateBookmarkContext();
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
