import * as React from '@theia/core/shared/react';
import { Exercise } from '../../exercise-service/types';
import { ExerciseItem } from "./exercise-item";

export type Props = {
    exercises: Exercise[]
    createExerciseFile: (exerciseId: string) => Promise<void>
    removeExercise: (exerciseId: string) => Promise<void>
}

export const ExerciseList: React.FC<Props> = ({exercises,createExerciseFile, removeExercise}) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingRight: 10,
            paddingLeft: 10,
        }}>
            {exercises.map(exercise => {
                return (
                    <ExerciseItem
                        key={exercise.exerciseId}
                        exercise={exercise}
                        createExerciseFile={createExerciseFile}
                        removeExercise={removeExercise}
                    />
                )
            })}
            {exercises.length === 0 && (
                <span>No exercise was found...</span>
            )}
        </div>
    )
}
