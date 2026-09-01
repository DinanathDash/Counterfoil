import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validate = (schema: ZodObject<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsed.body;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.query = parsed.query as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      req.params = parsed.params as any;

      next();
    } catch (error) {
      next(error);
    }
  };
};
