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
            padding: 10,
        }}>
            <div style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
            }}>
                <span>{file.fileName}</span>
                {isOpen ? (
                    <span className="codicon codicon-arrow-up" title="collapse" onClick={showFileContent}/>
                ) : (
                    <span className="codicon codicon-arrow-down" title="expand" onClick={showFileContent}/>
                )}
            </div>
            {isOpen && (
                <div className="theia-CodePartRenderer-bottom">
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
