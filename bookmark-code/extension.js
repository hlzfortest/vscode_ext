import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context) {
	const bookmarkProvider = new BookmarkProvider(context);

	vscode.window.registerTreeDataProvider('bookmarksList', bookmarkProvider);
	
	bookmarkProvider.loadBookmarks();

    vscode.window.onDidChangeActiveTextEditor(() => {
        bookmarkProvider.updateDecorations();
        bookmarkProvider.updateBookmarkContext();
    });

    vscode.window.onDidChangeTextEditorSelection(() => {
        bookmarkProvider.updateBookmarkContext(); // Add this
    });

	const addBookmarkCommand = vscode.commands.registerCommand('bookmarks.add', async (context) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}
		const lineNumber = context.lineNumber ? context.lineNumber - 1 : editor.selection.active.line;
		const fileKey = editor.document.uri.toString();
		const fileBookmarks = bookmarkProvider.getBookmarks(fileKey) || [];
		const existingBookmark = fileBookmarks.find(b => b.line === lineNumber);
		if (existingBookmark) {
			vscode.window.showInformationMessage('Bookmark already exists at this line');
			return;
		}
		bookmarkProvider.addBookmark(editor.document.uri, lineNumber);
        bookmarkProvider.updateContextForClickedLine(lineNumber, editor.document.uri);
		vscode.window.showInformationMessage('Bookmark added');
	});

	const removeBookmarkCommand = vscode.commands.registerCommand('bookmarks.remove', async (context) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor');
			return;
		}
		const lineNumber = context.lineNumber ? context.lineNumber - 1 : editor.selection.active.line;
		const wasRemoved = bookmarkProvider.removeBookmark(editor.document.uri, lineNumber);
        bookmarkProvider.updateContextForClickedLine(lineNumber, editor.document.uri);
		if (wasRemoved) {
			vscode.window.showInformationMessage('Bookmark removed');
		} else {
			vscode.window.showInformationMessage('No bookmark found at this line');
		}
	});

    // const editLabelCommand = vscode.commands.registerCommand('bookmarks.editLabel', async (bookmarkItem) => {
    //     if (!bookmarkItem || bookmarkItem.type !== 'bookmark') {
    //         return;
    //     }
    //     const fileKey = bookmarkItem.fileUri.toString();
    //     const fileBookmarks = bookmarkProvider.getBookmarks(fileKey) || [];
    //     const bookmark = fileBookmarks.find(b => b.line === bookmarkItem.line);
    //     if (!bookmark) {
    //         return;
    //     }
    //     const newLabel = await vscode.window.showInputBox({
    //         prompt: 'Enter bookmark label',
    //         value: bookmark.label || '',
    //         placeHolder: 'Optional label for this bookmark'
    //     });
    //     if (newLabel === undefined) {
    //         return;
    //     }
    //     bookmarkProvider.updateBookmarkLabel(bookmarkItem.fileUri, bookmarkItem.line, newLabel || undefined);
    //     vscode.window.showInformationMessage('Bookmark label updated');
    // });

	// context.subscriptions.push(addBookmarkCommand, removeBookmarkCommand, editLabelCommand);
	context.subscriptions.push(addBookmarkCommand, removeBookmarkCommand);
}

class BookmarkProvider{
	_onDidChangeTreeData= new vscode.EventEmitter();
	onDidChangeTreeData = this._onDidChangeTreeData.event;

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
        if (!editor) {
            vscode.commands.executeCommand('setContext', 'bookmarks.hasBookmarkAtCurrentLine', false);
            return;
        }
        const fileKey = editor.document.uri.toString();
        const fileBookmarks = this.bookmarks.get(fileKey) || [];
        const currentLine = editor.selection.active.line; // 0-based cursor position
        const bookmarkedLines = fileBookmarks.map(b => b.line + 1);
        vscode.commands.executeCommand('setContext', 'bookmarks.lines', bookmarkedLines);
    }

    refresh(){
        this._onDidChangeTreeData.fire();
    }

    loadBookmarks(){
        const stored = this.context.workspaceState.get('bookmarks', {});
        this.bookmarks = new Map(Object.entries(stored));
        this.refresh();
		this.updateDecorations();
        this.updateBookmarkContext();
    }

	updateDecorations(){
		vscode.window.visibleTextEditors.forEach(editor => {
			const fileKey = editor.document.uri.toString();
			const fileBookmarks = this.bookmarks.get(fileKey) || [];
			const decorationRanges = fileBookmarks.map(bookmark => {
                return new vscode.Range(bookmark.line, 0, bookmark.line, 0);	//開始行、開始列、終了行、終了列
            });
			editor.setDecorations(this.bookmarkDecoration, decorationRanges);
		});
	}

	getBookmarks(fileKey){
    	return this.bookmarks.get(fileKey);
	}

	addBookmark(fileUri, line, label){
		const fileKey = fileUri.toString();
		const fileBookmarks = this.bookmarks.get(fileKey) || [];
		const newBookmark = { line, label };
		fileBookmarks.push(newBookmark);
		fileBookmarks.sort((a, b) => a.line - b.line);
		this.bookmarks.set(fileKey, fileBookmarks);
		this.saveBookmarks();
		this.refresh();
		this.updateDecorations();
        this.updateBookmarkContext();
	}

	removeBookmark(fileUri, line){
		const fileKey = fileUri.toString();
		const fileBookmarks = this.bookmarks.get(fileKey) || [];
		const existingIndex = fileBookmarks.findIndex(b => b.line === line);
		if (existingIndex >= 0) {
			fileBookmarks.splice(existingIndex, 1);
			if (fileBookmarks.length === 0) {
				this.bookmarks.delete(fileKey);
			} else {
				this.bookmarks.set(fileKey, fileBookmarks);
			}
			this.saveBookmarks();
			this.refresh();
			this.updateDecorations();
            this.updateBookmarkContext();
			return true;
		}
		return false;
	}

    async saveBookmarks(){
        const bookmarksObject = Object.fromEntries(this.bookmarks);
        await this.context.workspaceState.update('bookmarks', bookmarksObject);
    }

    updateContextForClickedLine(lineNumber, fileUri){
        const fileKey = fileUri.toString();
        const fileBookmarks = this.bookmarks.get(fileKey) || [];
        const hasBookmark = fileBookmarks.some(b => b.line === lineNumber);
        vscode.commands.executeCommand('setContext', 'bookmarks.hasBookmarkAtCurrentLine', hasBookmark);
    }

    updateBookmarkLabel(fileUri, line, newLabel){
        const fileKey = fileUri.toString();
        const fileBookmarks = this.bookmarks.get(fileKey) || [];
        const bookmark = fileBookmarks.find(b => b.line === line);
        if (bookmark) {
            bookmark.label = newLabel;
            this.bookmarks.set(fileKey, fileBookmarks);
            this.saveBookmarks();
            this.refresh();
        }
    }

    getTreeItem(element){
        if (element.type === 'file') {
            const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.Expanded);
            item.iconPath = vscode.ThemeIcon.File;
            return item;
        } else {
            const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
            item.iconPath = new vscode.ThemeIcon('bookmark');
            item.command = {
                command: 'vscode.open',
                title: 'Go to Bookmark',
                arguments: [
                    element.fileUri,
                    { selection: new vscode.Range(element.line, 0, element.line, 0) }
                ]
            };
            item.contextValue = 'bookmark';
            return item;
        }
    }

    async getChildren(element){
        if (!element) {
            const fileItems = [];
            for (const [fileUriString, bookmarks] of this.bookmarks) {
                if (bookmarks.length > 0) {
                    const fileUri = vscode.Uri.parse(fileUriString);
                    const fileName = fileUri.path.split('/').pop() || fileUriString;
                    fileItems.push({
                        type: 'file',
                        label: fileName,
                        fileUri: fileUri,
                        bookmarks: bookmarks
                    });
                }
            }
            return fileItems;
        } else if (element.type === 'file') {
            const bookmarkItems = [];
            for (const bookmark of element.bookmarks || []) {
                const label = bookmark.label 
                    ? `Line ${bookmark.line + 1}: ${bookmark.label}`
                    : `Line ${bookmark.line + 1}`;
                bookmarkItems.push({
                    type: 'bookmark',
                    label: label,
                    fileUri: element.fileUri,
                    line: bookmark.line
                });
            }
            return bookmarkItems;
        }
        return [];
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
