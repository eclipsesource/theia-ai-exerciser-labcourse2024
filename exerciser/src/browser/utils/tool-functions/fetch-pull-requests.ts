import { injectable } from "@theia/core/shared/inversify";
import { ToolProvider, ToolRequest } from "@theia/ai-core";
import { FETCH_PULL_REQUESTS_FUNCTION_ID } from "./function-names";

@injectable()
export class FetchPullRequests implements ToolProvider {
    static ID = FETCH_PULL_REQUESTS_FUNCTION_ID;

    getTool(): ToolRequest {
        return {
            id: FetchPullRequests.ID,
            name: FetchPullRequests.ID,
            description: "Fetch the last 10 pull requests of a GitHub user",
            parameters: {
                type: "object",
                properties: {
                    username: {
                        type: "string",
                        description: "The GitHub username to fetch pull requests for",
                    },
                },
            },
            handler: async (arg_string: string) => {
                try {
                    const { username } = this.parseArgs(arg_string);
                    const result = await this.fetchPullRequests(username);
                    console.log("FetchPullRequests Result:", result);
                    return result;
                } catch (error) {
                    console.error("Error in FetchPullRequests Handler:", error.message);
                    return `Error: ${error.message}`;
                }
            }
            
        };
    }

    /**
     * Parses the arguments passed as a string.
     * @param arg_string JSON string containing parameters.
     * @returns Parsed arguments.
     */
    private parseArgs(arg_string: string): { username: string } {
        return JSON.parse(arg_string);
    }

    /**
     * Fetches the last 10 pull requests for the specified GitHub user.
     * @param username The GitHub username.
     * @returns A promise that resolves to the pull requests or an error message.
     */
    private async fetchPullRequests(username: string): Promise<string> {
        const url = `https://api.github.com/search/issues?q=type:pr+author:${username}&sort=updated&order=desc&per_page=10`;

        const headers = {
            Accept: "application/vnd.github.v3+json",
        };

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            const data = await response.json();
            const pullRequests = data.items.map((pr: any) => ({
                title: pr.title,
                repository: pr.repository_url,
                url: pr.html_url,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
            }));

            return JSON.stringify(pullRequests, null, 2);
        } catch (error) {
            return `Error fetching pull requests: ${error.message}`;
        }
    }
}