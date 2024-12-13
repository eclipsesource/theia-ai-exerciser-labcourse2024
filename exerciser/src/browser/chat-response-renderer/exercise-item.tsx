import * as React from '@theia/core/shared/react';
import {ExerciseFile} from "../exercise-service/types";

export type Props = {
    file: ExerciseFile
}

export const ExerciseItem: React.FC<Props> = ({file}) => {
    const [isOpen, setIsOpen] = React.useState(false)

    const showFileContent = () => {
        setIsOpen(prevState => !prevState);
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            padding: 10,
            borderRadius: 4,
            border: "1px solid var(--theia-sideBarSectionHeader-border)",
        }} className={"separator-border fa-border "}>
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
                <div>
                    {file.content.split("\n").map(line => {
                        return <p>{line}</p>
                    })}
                </div>
            )}
        </div>
    )
}
