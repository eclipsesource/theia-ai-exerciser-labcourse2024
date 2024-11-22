import * as React from '@theia/core/shared/react';
import {fileToBeGenerated} from "../exercise-creator/types";
import {FileItem} from "./FileItem";

export type Props = {
    files: fileToBeGenerated[]
}

export const FileList: React.FC<Props> = ({files}) => {
    return (
        <div>
            {files.map(file => {
                return <FileItem key={file.fileName} file={file}/>
            })}
        </div>
    )
}
