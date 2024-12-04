import * as React from '@theia/core/shared/react';
import {fileToBeGenerated} from "../types";

export type Props = {
    file: fileToBeGenerated
}

export const FileItem: React.FC<Props> = ({file}) => {
    const [isOpen, setIsOpen] = React.useState(false)

    const showFileContent = () => {
        setIsOpen(prevState => !prevState);
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "column"
        }}>
            <div style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
            }}>
                <p>{file.fileName}</p>
                <button onClick={showFileContent}>{isOpen ? "collapse" : "expand"}</button>
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
