import * as React from '@theia/core/shared/react';
import {ExerciseFile} from "../exercise-service/types";
import {CodeWrapper} from "@theia/ai-chat-ui/lib/browser/chat-response-renderer";
import {UntitledResourceResolver} from "@theia/core";
import {MonacoEditorProvider} from "@theia/monaco/lib/browser/monaco-editor-provider";

export type Props = {
    file: ExerciseFile;
    untitledResourceResolver: UntitledResourceResolver;
    editorProvider: MonacoEditorProvider;
}

export const ExerciseItem: React.FC<Props> = ({file, untitledResourceResolver, editorProvider}) => {
    const [isOpen, setIsOpen] = React.useState(false)

    const showFileContent = () => {
        setIsOpen(prevState => !prevState);
    }

    return (
        <div key={file.fileName} style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            backgroundColor: "var(--theia-editor-background)",
            borderRadius: 6,
            overflow: "hidden"
        }}>
            <div style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 10,
            }}>
                <span>{file.fileName}</span>
                {isOpen ? (
                    <span className="codicon codicon-arrow-up" title="collapse" onClick={showFileContent}/>
                ) : (
                    <span className="codicon codicon-arrow-down" title="expand" onClick={showFileContent}/>
                )}
            </div>
            {isOpen && (
                <div style={{border: "none !important"}}>
                    <CodeWrapper
                        content={file.content}
                        untitledResourceResolver={untitledResourceResolver}
                        editorProvider={editorProvider}
                        language={`.${file.fileName.split(".").pop()}`}
                        contextMenuCallback={e => {
                        }}></CodeWrapper>
                </div>
            )}
        </div>
    )
}
