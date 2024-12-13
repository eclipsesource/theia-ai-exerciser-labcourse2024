import * as React from '@theia/core/shared/react';
import {ExerciseItem} from "./exercise-item";
import {ExerciseFile} from "../exercise-service/types";

export type Props = {
    files: ExerciseFile[],
    createExerciseCallback: () => void
}

export const ExerciseList: React.FC<Props> = ({files, createExerciseCallback}) => {
    const [isCallbackCalled, setIsCallbackCalled] = React.useState(false);

    const handleCreate = () => {
        createExerciseCallback();
        setIsCallbackCalled(true)
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            marginBottom: 5
        }}>
            {files.map((file, index) => {
                return <ExerciseItem key={index} file={file}/>
            })}
            <button
                style={{alignSelf: "end"}}
                className={"theia-button main"}
                onClick={handleCreate}
                disabled={isCallbackCalled}
            >
                Create Exercise
            </button>
        </div>
    )
}
