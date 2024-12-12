import * as React from '@theia/core/shared/react';
import {  ExerciseOverview } from '../../exercise-service/types';

export type Props = {
    exercise: ExerciseOverview
    fileCreation: (fileName: string) => void
}

export const ExerciseWidgetItem: React.FC<Props> = ({ exercise,fileCreation }) => {
    const [isOpen, setIsOpen] = React.useState(false)

    const showFileContent = () => {
        setIsOpen(prevState => !prevState);
    }

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
        }}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                border: "solid",
                borderRadius: 4,
                padding: 10
            }}>
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                }}>
                    <span>{exercise.exerciseName}</span>
                    {isOpen ? (
                        <span className="codicon codicon-arrow-up" title="collapse" onClick={showFileContent} />
                    ) : (
                        <span className="codicon codicon-arrow-down" title="expand" onClick={showFileContent} />
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
            <button onClick={()=>fileCreation(exercise.exerciseId)} className="theia-button secondary" id="getExerciseListButton">Create exercise</button>
        </div>
    )
}
