import * as React from '@theia/core/shared/react';
import { Exercise } from "../../exercise-service/types";

export type Props = {
    handleImportExercise: (exercise: Exercise) => void
}

export const ImportExerciseButton: React.FC<Props> = ({handleImportExercise}) => {
    const inputFile = React.useRef<HTMLInputElement>(null);

    const onButtonClick = () => {
        // `current` points to the mounted file input element
        inputFile.current?.click();
    };

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const exercise = JSON.parse(e.target?.result as string) as Exercise;
                    handleImportExercise(exercise)
                    console.log("Parsed JSON:", exercise);
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                }
            };
            reader.readAsText(file);
            inputFile.current!.value = ""
        } else {
            console.error("Please upload a valid exercise file.");
        }
    };

    return (
        <>
            <input
                type='file'
                id='file'
                ref={inputFile}
                style={{display: 'none'}}
                onChange={onFileChange}
                accept="application/json"
            />
            <button className={"theia-button main"} onClick={onButtonClick}>Import Exercise</button>
        </>
    )
}
