import { Router } from 'express';
import {
  createNewUser,
  generateVerificationLink,
  sendProfile,
  signIn,
  verifyEmail,
} from 'controllers/auth';
import validate from 'src/middleware/validator';
import { newUserSchema, verifyTokenSchema } from 'src/utils/validationSchema';
import { isAuth } from 'src/middleware/auth';

const authRouter = Router();

authRouter.post('/sign-up', validate(newUserSchema), createNewUser);
authRouter.post('/verify', validate(verifyTokenSchema), verifyEmail);
authRouter.get('/verify-token', isAuth, generateVerificationLink);
authRouter.post('/sign-in', signIn);
authRouter.get('/profile', isAuth, sendProfile);

export default authRouter;
