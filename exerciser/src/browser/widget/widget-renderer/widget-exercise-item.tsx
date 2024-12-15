import * as React from '@theia/core/shared/react';
import {  ExerciseOverview } from '../../exercise-service/types';

export type Props = {
    exercise: ExerciseOverview
    createExerciseFile: (exerciseId: string) => Promise<void>
    removeExercise: (exerciseId: string) => Promise<void>
}

export const ExerciseWidgetItem: React.FC<Props> = ({ exercise,createExerciseFile, removeExercise }) => {
    const [isOpen, setIsOpen] = React.useState(false)

    const showFileContent = () => {
        setIsOpen(prevState => !prevState);
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            marginBottom: 5
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                padding: 10,
                borderRadius: 4,
                border: "1px solid var(--theia-sideBarSectionHeader-border)",
            }}>
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                }}>
                    <span>{exercise.exerciseName}</span>
                    {isOpen ? (
                        <span className="codicon codicon-arrow-up" title="collapse" onClick={showFileContent}/>
                    ) : (
                        <span className="codicon codicon-arrow-down" title="expand" onClick={showFileContent}/>
                    )}
                </div>
                {isOpen && (
                    <div>
                        {exercise.exerciseSummarization.split("\n").map(line => {
                            return <p>{line}</p>
                        })}
                    </div>
                )}
            </div>
            <div style={{alignSelf: "end"}}>
                <button
                    className={"theia-button main"}
                    onClick={() => createExerciseFile(exercise.exerciseId)}
                >
                    Create exercise files
                </button>
                <button
                    className={"theia-button main"}
                    onClick={() => removeExercise(exercise.exerciseId)}
                >
                    Remove exercise
                </button>
            </div>
        </div>
    )
}
