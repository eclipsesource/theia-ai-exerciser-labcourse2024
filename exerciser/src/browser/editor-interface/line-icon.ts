import { injectable, inject } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import * as monaco from '@theia/monaco-editor-core';
monaco.editor.registerCommand

// const CREATE_EXERCISE_COMMAND: Command = {
//     id: 'exercise.create',
//     label: 'Create Exercise',
// };

// const DELETE_EXERCISE_COMMAND: Command = {
//     id: 'exercise.delete',
//     label: 'Delete Exercise',
// };
@injectable()
export class LineIconContribution implements FrontendApplicationContribution {

    constructor(@inject(EditorManager) protected readonly editorManager: EditorManager) { }

    private decorationCollection: monaco.editor.IEditorDecorationsCollection | undefined;


    onStart(): void {
        this.editorManager.onActiveEditorChanged(editor => {
            console.log('Active editor changed:', editor);
            if (editor) {
                const monacoEditor = editor.editor as MonacoEditor;
                if (monacoEditor) {
                    console.log('Monaco editor:', monacoEditor);
                    const model = monacoEditor.getControl();
                    if (this.decorationCollection) {
                        this.decorationCollection.set([])
                    }
                    // Create a decorations collection for the editor
                    this.decorationCollection = model.createDecorationsCollection([]);


                    model.onDidChangeCursorPosition((event) => {
                        const position = event.position;

                        // Add icon to the focused line
                        this.addIconToLine(monacoEditor, position);
                    });
                }
            }
        });
    }

    protected addIconToLine(editor: MonacoEditor, position: monaco.Position): void {
        const model = editor.getControl().getModel();
        if (!model) {
            return;
        }
        const lineNumber = position.lineNumber

        const lineContent = model.getLineContent(position.lineNumber);
        const firstThreeColumns = lineContent.slice(0, 3);
        const cursorInFirstThreeColumns = position.column <= 3;
        const firstThreeColumnsAreEmpty = firstThreeColumns.trim().length === 0;

        let decorationOptions: monaco.editor.IModelDecorationOptions;
        if (cursorInFirstThreeColumns || !firstThreeColumnsAreEmpty) {
            decorationOptions = {
                glyphMarginClassName: 'codicon codicon-light-bulb',
                glyphMarginHoverMessage: [{
                    value: `**Exercise Options**  
                    [Ask for a hint](command:exerciseHint.query?{"lineNumber":${lineNumber}})`, 
                    isTrusted: true,
                }],
                zIndex: 1000
            }
                
        }else{

            decorationOptions = {
                hoverMessage: {
                    value: `**Exercise Options**  
                    [Ask for a hint](command:exerciseHint.query?{"lineNumber":${lineNumber}})`, 
                    isTrusted: true,
                },

                className: 'codicon codicon-light-bulb',
                zIndex: 1000
            }
        }
        const decoration: monaco.editor.IModelDeltaDecoration[] = [
            {
                range: new monaco.Range(lineNumber, 1, lineNumber, 2),
                options:decorationOptions
                // options: {
                //     isWholeLine: true, // Highlight the whole line
                //     className: 'custom-red-background', // Custom CSS class
                // },
            }
        ];


        // const control = editor.getControl();

        if (this.decorationCollection) {
            // Replace current decorations with the new one
            this.decorationCollection.set(decoration);
        }

        // Listen for clicks on the glyph margin
        // control.onMouseDown((event) => {
        //     if (event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN && event.target.position?.lineNumber === lineNumber) {
        //         console.log('Icon clicked for line:', lineNumber);

        //         // Trigger chat query (example: open a modal, send data)
        //         this.sendQueryToChat(editor, lineNumber);
        //     }
        // });
    }

    protected sendQueryToChat(editor: MonacoEditor, lineNumber: number): void {
        const lineContent = editor.getControl().getModel()?.getLineContent(lineNumber);
        console.log('Sending query for:', lineContent);

        // Example: Send query to your chat API
        // fetch('/api/chat', { method: 'POST', body: JSON.stringify({ query: lineContent }) });
    }
}
