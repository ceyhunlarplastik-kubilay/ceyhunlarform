import { FieldValues, Resolver } from "react-hook-form";
import { ZodError, ZodType } from "zod";

export const zodResolver =
    <T extends FieldValues>(schema: ZodType<T>): Resolver<T> =>
        async (values) => {
            try {
                const data = await schema.parseAsync(values);

                return {
                    values: data,
                    errors: {},
                };
            } catch (error) {
                if (error instanceof ZodError) {
                    const fieldErrors: Record<string, any> = {};

                    for (const issue of error.issues) {
                        const path = issue.path.map(String);

                        let current = fieldErrors;
                        for (let i = 0; i < path.length; i++) {
                            const key = path[i];

                            if (i === path.length - 1) {
                                current[key] = {
                                    type: issue.code,
                                    message: issue.message,
                                };
                            } else {
                                current[key] ??= {};
                                current = current[key];
                            }
                        }
                    }

                    return {
                        values: {},
                        errors: fieldErrors,
                    };
                }

                return {
                    values: {},
                    errors: {
                        root: {
                            type: "validation",
                            message: "Unexpected validation error",
                        },
                    },
                };
            }
        };
