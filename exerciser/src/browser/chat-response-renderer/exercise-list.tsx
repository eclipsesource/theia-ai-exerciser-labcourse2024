import * as React from '@theia/core/shared/react';
import {ExerciseItem} from "./exercise-item";
import {ExerciseFile} from "../exercise-service/types";
import {UntitledResourceResolver} from "@theia/core";
import {MonacoEditorProvider} from "@theia/monaco/lib/browser/monaco-editor-provider";

export type Props = {
    type: "creator" | "conductor",
    files: ExerciseFile[],
    buttonContent: string,
    callback: () => void,
    untitledResourceResolver: UntitledResourceResolver;
    editorProvider: MonacoEditorProvider;
}

export const ExerciseList: React.FC<Props> = ({type, files, buttonContent, callback, untitledResourceResolver, editorProvider}) => {
    const [isShowSolutions, setIsShowSolutions] = React.useState(false);
    const [isCallbackCalled, setIsCallbackCalled] = React.useState(false);

    const handleCreate = () => {
        callback();
        setIsCallbackCalled(true)
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            marginBottom: 5
        }}>
            <div style={{
                alignSelf: "end",
                display: "flex",
                flexDirection: "row",
                gap: 5,
            }}>
                <button
                    className={"theia-button main"}
                    onClick={() => setIsShowSolutions(prevState => !prevState)}
                >
                    {!isShowSolutions ? "Show Solutions" : "Hide Solutions"}
                </button>
                <button
                    className={"theia-button main"}
                    onClick={handleCreate}
                    disabled={isCallbackCalled}
                >
                    {buttonContent}
                </button>
            </div>
            {files.map((file, index) => {
                if (type === "conductor") {
                    return <ExerciseItem key={file.fileName} file={file} untitledResourceResolver={untitledResourceResolver} editorProvider={editorProvider}/>
                } else {
                    if (isShowSolutions && index < files.length / 2)
                        return <ExerciseItem key={file.fileName} file={file} untitledResourceResolver={untitledResourceResolver} editorProvider={editorProvider}/>
                    if (!isShowSolutions && index >= files.length / 2)
                        return <ExerciseItem key={file.fileName} file={file} untitledResourceResolver={untitledResourceResolver} editorProvider={editorProvider}/>
                }
            })}
        </div>
    )
}
