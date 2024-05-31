// IMPORTS --------------------------------
import { RequestHandler } from 'express';
import { sendErrorResponse } from 'src/utils/helper';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import UserModel from 'src/models/user';
import PasswordResetTokenModel from 'src/models/passwordResetToken';

// TS: customize req object ---------------------------------
interface UserProfile {
  id: string;
  name: string;
  email: string;
  verified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user: UserProfile;
    }
  }
}

const jwtSecret = process.env.JWT_SECRET!;
// AUTH MIDDLEWARE FUNCTIONS ------------------------------
// verify user tokens
export const isAuth: RequestHandler = async (req, res, next) => {
  // try/catch to handle jwt errors
  try {
    // read token from authorization header, if none error response
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return sendErrorResponse(res, 'Unauthorized request.', 403);

    // verify token, if no user send error response
    const token = authHeader.split('Bearer ')[1];
    const payload = jwt.verify(token, jwtSecret) as { id: string };

    const user = await UserModel.findById(payload.id);
    if (!user) return sendErrorResponse(res, 'Unauthorized request.', 403);

    // create req.user
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
    };

    next();
  } catch (error) {
    // expired token
    if (error instanceof TokenExpiredError) {
      return sendErrorResponse(res, 'Session expired.', 401);
    }
    // other token errors
    if (error instanceof JsonWebTokenError) {
      return sendErrorResponse(res, 'Unauthorized access.', 401);
    }
    next(error);
  }
};

export const isValidPasswordResetToken: RequestHandler = async (
  req,
  res,
  next
) => {
  // read id and token and find token, if not send error
  const { id, token } = req.body;
  const resetPasswordToken = await PasswordResetTokenModel.findOne({
    owner: id,
  });
  if (!resetPasswordToken)
    return sendErrorResponse(res, 'Unauthorized requeest, invalid token.', 403);
  // compare token, if not send error
  const match = await resetPasswordToken.compareToken(token);
  if (!match)
    return sendErrorResponse(res, 'Unauthorized requeest, invalid token.', 403);

  next();
};
