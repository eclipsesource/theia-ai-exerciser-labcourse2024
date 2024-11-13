// import { inject, injectable } from "@theia/core/shared/inversify";
// import { URI } from '@theia/core';
// import { ToolProvider, ToolRequest } from '@theia/ai-core';
// import { FileService } from '@theia/filesystem/lib/browser/file-service';
// import { COMPARE_FILES_CONTENT_FUNCTION_ID } from "./function-names";

// @injectable()
// export class CompareFilesContent implements ToolProvider {
//     static ID = COMPARE_FILES_CONTENT_FUNCTION_ID;

//     getTool(): ToolRequest {
//         return {
//             id: CompareFilesContent.ID,
//             name: CompareFilesContent.ID,
//             description: 'Compare the content of two files',
//             parameters: {
//                 type: 'object',
//                 properties: {
//                     filePath1: {
//                         type: 'string',
//                         description: 'Path of the first file'
//                     },
//                     filePath2: {
//                         type: 'string',
//                         description: 'Path of the second file'
//                     }
//                 },
               
//             },
//             handler: (arg_string: string) => {
//                 const { filePath1, filePath2 } = this.parseArgs(arg_string);
//                 return this.compareFilesContent(filePath1, filePath2);
//             }
//         };
//     }

//     @inject(FileService)
//     protected readonly fileService: FileService;

//     private parseArgs(arg_string: string): { filePath1: string; filePath2: string } {
//         return JSON.parse(arg_string);
//     }

//     private async compareFilesContent(filePath1: string, filePath2: string): Promise<string> {
//         const uri1 = new URI(filePath1);
//         const uri2 = new URI(filePath2);

//         try {
//         const fileStat1 = await this.fileService.read(uri1);
//         const content1 = new TextDecoder().decode(fileStat1.value);

       
//         const fileStat2 = await this.fileService.read(uri2);
//         const content2 = new TextDecoder().decode(fileStat2.value);
        

//             if (content1 === content2) {
//                 return `Files ${filePath1} and ${filePath2} have identical content.`;
//             } else {
//                 return `Files ${filePath1} and ${filePath2} have different content.`;
//             }
//         } catch (error) {
//             return `Failed to compare files: ${error.message}`;
//         }
//     }
// }
