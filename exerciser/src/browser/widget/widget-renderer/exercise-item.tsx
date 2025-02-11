import * as React from '@theia/core/shared/react';
import { Exercise } from '../../exercise-service/types';

export type Props = {
    exercise: Exercise
    createExerciseFile: (exerciseId: string) => Promise<void>
    removeExercise: (exerciseId: string) => Promise<void>
}

export const ExerciseItem: React.FC<Props> = ({ exercise,createExerciseFile, removeExercise }) => {
    const downloadJsonFile = () => {
        const jsonString = JSON.stringify(exercise, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${exercise.exerciseName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "var(--theia-dropdown-border)"
        }}>
            <div style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 10,
                backgroundColor: "var(--theia-editor-background)",
            }}>
                <span>{exercise.exerciseName}</span>
            </div>
            <div style={{
                paddingLeft: 10,
                paddingRight: 10,
                backgroundColor: "var(--theia-toolbar-hoverBackground)"
            }}>
                {exercise.exerciseSummarization.split("\n").map(line => {
                    return <p>{line}</p>
                })}
            </div>
            <div style={{
                display: "flex",
                justifyContent: "end",
                alignItems: "center",
                padding: 7,
                gap: 10,
                backgroundColor: "var(--theia-editor-background)",
            }}>
                <span
                    className={`action`}
                    title={"Conduct Exercise"}
                    onClick={() => createExerciseFile(exercise.exerciseId)}
                >
                    <span className={`codicon codicon-code`}/>
                </span>
                <span
                    className={`action`}
                    title={"Download Exercise"}
                    onClick={downloadJsonFile}
                >
                    <span className={`codicon codicon-file-zip`}/>
                </span>
                <span
                    className={`action`}
                    title={"Remove Exercise"}
                    onClick={() => removeExercise(exercise.exerciseId)}
                >
                    <span className={`codicon codicon-trash`}/>
                </span>
            </div>
        </div>
    )
}
