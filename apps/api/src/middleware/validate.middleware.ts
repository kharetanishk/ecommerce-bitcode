import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.reduce(
          (acc, e) => {
            const key = e.path.join(".");
            acc[key] = acc[key] ? [...acc[key], e.message] : [e.message];
            return acc;
          },
          {} as Record<string, string[]>,
        );
        res.status(400).json({ error: "Validation failed", details });
        return;
      }
      next(error);
    }
  };
}

//validate query
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Invalid query parameters",
          details: err.flatten().fieldErrors,
        });
        return;
      }
      next(err);
    }
  };
}
