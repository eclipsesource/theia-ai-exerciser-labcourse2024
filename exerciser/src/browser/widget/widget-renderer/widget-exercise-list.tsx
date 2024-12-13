import * as React from '@theia/core/shared/react';
import { ExerciseWidgetItem } from './widget-exercise-item';
import { ExerciseOverview } from '../../exercise-service/types';

export type Props = {
    exercises: ExerciseOverview[]
    fileCreation: (exerciseId: string) => Promise<void>
}

export const ExerciseWidgetList: React.FC<Props> = ({exercises,fileCreation}) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            marginBottom: 5
        }}>
            {exercises.map(exercise => {
                return <ExerciseWidgetItem key={exercise.exerciseId} exercise={exercise} fileCreation={fileCreation}/>
            })}
            {exercises.length === 0 && (
                <p>No exercise was found...</p>
            )}
        </div>
    )
}
