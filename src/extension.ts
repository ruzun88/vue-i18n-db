// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { window, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument } from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vue-i18n-db" is now active!');

	let i18nFinder = new I18nFinder();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vue-i18n-db.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from vue-i18n-db! by YJ');
		i18nFinder.updateWordCount();
	});

	context.subscriptions.push(i18nFinder);
	context.subscriptions.push(disposable);
}
class I18nFinder {

	private _statusBarItem: StatusBarItem =  window.createStatusBarItem(StatusBarAlignment.Left);

	public updateWordCount() {

			// Get the current text editor
			let editor = window.activeTextEditor;
			if (!editor) {
					this._statusBarItem.hide();
					return;
			}

			let doc = editor.document;

			// Only update status if a Markdown file
			// markdown 체크
			console.log(doc.languageId);
			if (doc.languageId === "vue" || doc.languageId === "javascript") {
					let wordCount = this._getI18nUsageCount(doc);

					// Update the status bar
					this._statusBarItem.text = wordCount !== 1 ? `${wordCount} Words` : '1 Word';
					this._statusBarItem.show();
			} else {
					this._statusBarItem.hide();
			}
	}
	// i18n-ally의 key detector를 사용하는 것을 고려하자.
	public _getI18nUsageCount(doc: TextDocument): number {

		let text = doc.getText();

		// Parse out unwanted whitespace so the split is accurate
		// docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
		// docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		// let wordCount = 0;
		// // let regexp = /(?:(?:this\.|[^\\w\\d])(?:\$t|\$ta)\(\s*[\'"`]({key})[\'"`]\s*\))/g;
		
		// if (docContent !== "") {
		// 	const array = [...docContent.matchAll(regexp)];
		// 	console.log(array);
		// 	wordCount = array.length;
		// 		// wordCount = docContent.split(" ").length;
		// }
		const keys = new Set<string>();
		const regs = this.getUsageMatchRegex();

		for (const reg of regs) {
			(text.match(reg) || [])
				.forEach(key => {
					if ( key.length !== 0) {
						console.log(key);
					}
					keys.add(key.replace(reg, '$1'));
				}
				);
		}
		let arr = Array.from(keys);
		console.log(arr);
    return arr.length;

			// return wordCount;
	}

	dispose() {
			this._statusBarItem.dispose();
	}
	getUsageMatchRegex() {
		return [
			// Directive
			'v-t:({key})[\\s\\n=]',
			// Component
			'i18n[ (\\n]\\s*path=[\'"`]({key})[\'"`]',
			// Instance methods
			'(?:(?:this\\.|[^\\w\\d])(?:\\$t|\\$ta)\\()\\s*[\'"`]({key})[\'"`]',
			// fluent methods
			'(?:fluent\\.(?:format|formatAttrs)\\()\\s*[\'"`]({key})[\'"`]',
			// test
			'<[\\\w.]+>',
			'(?:(?:this\.|[^\\w\\d])(?:\$t|\$ta)\(\s*[\'"`]({key})[\'"`]\s*\))',
		];
	}
}

class I18nWordCounter {

	private _wordCounter: WordCounter;
	private _disposable: Disposable;

	constructor(wordCounter: WordCounter) {
			this._wordCounter = wordCounter;

			// subscribe to selection change and editor activation events
			let subscriptions: Disposable[] = [];
			window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
			window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

			// update the counter for the current file
			// 키면 한번 업데이트
			console.log('update');
			this._wordCounter.updateWordCount();

			// create a combined disposable from both event subscriptions
			this._disposable = Disposable.from(...subscriptions);
	}

	dispose() {
			this._disposable.dispose();
	}

	private _onEvent() {
			console.log('_onEvent');
			this._wordCounter.updateWordCount();
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
