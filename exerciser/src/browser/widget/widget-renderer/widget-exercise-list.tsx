import * as React from '@theia/core/shared/react';
import { ExerciseWidgetItem } from './widget-exercise-item';
import { ExerciseOverview } from '../../exercise-service/types';

export type Props = {
    exercises: ExerciseOverview[]
    createExerciseFile: (exerciseId: string) => Promise<void>
    removeExercise: (exerciseId: string) => Promise<void>
}

export const ExerciseWidgetList: React.FC<Props> = ({exercises,createExerciseFile, removeExercise}) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            marginBottom: 5
        }}>
            {exercises.map(exercise => {
                return (
                    <ExerciseWidgetItem
                        key={exercise.exerciseId}
                        exercise={exercise}
                        createExerciseFile={createExerciseFile}
                        removeExercise={removeExercise}
                    />
                )
            })}
            {exercises.length === 0 && (
                <p>No exercise was found...</p>
            )}
        </div>
    )
}
