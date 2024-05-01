import { Response } from 'express';

export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode: number
) => {
  res.status(statusCode).json({ message });
};
