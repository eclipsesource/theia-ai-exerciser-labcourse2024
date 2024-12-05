import * as React from '@theia/core/shared/react';
import {ExerciseItem} from "./exercise-item";
import {ExerciseFile} from "../exercise-service/types";

export type Props = {
    files: ExerciseFile[]
}

export const ExerciseList: React.FC<Props> = ({files}) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            marginBottom: 5
        }}>
            {files.map(file => {
                return <ExerciseItem key={file.fileName} file={file}/>
            })}
        </div>
    )
}
