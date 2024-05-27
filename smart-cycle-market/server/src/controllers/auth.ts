// IMPORTS ------------------------------------
import { RequestHandler } from 'express';
import UserModel from 'src/models/user';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import AuthVerificationTokenModel from 'src/models/verificationToken';
import { sendErrorResponse } from 'src/utils/helper';
import jwt from 'jsonwebtoken';
import mail from 'src/utils/mail';
import PasswordResetTokenModel from 'src/models/passwordResetToken';

const JWT_SECRET = process.env.JWT_SECRET!;

// CONTROLLER FUNCTIONS -----------------------------------------------
export const createNewUser: RequestHandler = async (req, res) => {
  // read and check incoming data
  const { name, email, password } = req.body;

  // check if user exists, either create or send message
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return sendErrorResponse(res, 'Unauthorized request, email in use', 401);
  }
  const newUser = await UserModel.create({ name, email, password });
  // create verification token + email
  const token = crypto.randomBytes(36).toString('hex');
  await AuthVerificationTokenModel.create({ owner: newUser._id, token });
  const link = `${process.env.VERIFICATION_LINK}?id=${newUser._id}&token=${token}`;

  await mail.sendVerification(newUser.email, link);

  return res.json({ message: 'please check your inbox' });
};

export const verifyEmail: RequestHandler = async (req, res) => {
  // read incoming id and token
  const { id, token } = req.body;
  // find user token, if not send 403
  const authToken = await AuthVerificationTokenModel.findOne({ owner: id });
  if (!authToken) return sendErrorResponse(res, 'Unauthorized request!', 403);
  // verify token against hashed token in model
  const isMatch = await authToken.compareToken(token);
  if (!isMatch)
    return sendErrorResponse(res, 'Unauthorized request, token invalid', 403);
  // update UserModel and delete authToken from db
  await UserModel.findByIdAndUpdate(id, { verified: true });
  await AuthVerificationTokenModel.findByIdAndDelete(authToken._id);

  res.json({ message: 'Thanks for joining us, your email is verified!' });
};

export const signIn: RequestHandler = async (req, res) => {
  // read email, password from client
  const { email, password } = req.body;

  // match user in db or send error
  const user = await UserModel.findOne({ email });
  if (!user) return sendErrorResponse(res, 'Email/Password mismatch.', 403);

  // validate password or send error
  const isMatched = await user.comparePassword(password);
  if (!isMatched)
    return sendErrorResponse(res, 'Email/Password mismatch.', 403);

  // generate access and refresh tokens
  const payload = { id: user._id };
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign(payload, JWT_SECRET);

  // save tokens to db in userModel
  if (!user.tokens) user.tokens = [refreshToken];
  else user.tokens.push(refreshToken);
  await user.save();

  // send res with entire user profile and tokens
  res.json({
    profile: {
      id: user._id,
      email: user.email,
      name: user.name,
      verified: user.verified,
    },
    tokens: {
      refresh: refreshToken,
      access: accessToken,
    },
  });
};

export const sendProfile: RequestHandler = async (req, res) => {
  res.json({
    profile: req.user,
  });
};

export const generateVerificationLink: RequestHandler = async (req, res) => {
  // read id from req.user
  const { id } = req.user;
  // gen new auth token
  const token = crypto.randomBytes(36).toString('hex');
  // mail link
  const link = `${process.env.VERIFICATION_LINK}?id=${id}&token=${token}`;

  // look for verification token for owner: id, delete
  await AuthVerificationTokenModel.findOneAndDelete({ owner: id });

  // create and store new token
  await AuthVerificationTokenModel.create({ owner: id, token });

  await mail.sendVerification(req.user.email, link);

  res.json({ message: 'Please Check Your Inbox' });
};

export const grantAccessToken: RequestHandler = async (req, res) => {
  // read refresh token req.body, if none send err response
  const { refreshToken } = req.body;
  if (!refreshToken)
    return sendErrorResponse(
      res,
      'Unauthorized request, no refresh token.',
      403
    );

  // read user from token, check id and token
  const payload = jwt.verify(refreshToken, JWT_SECRET) as { id: string };
  if (!payload.id) {
    return sendErrorResponse(res, 'Unauthorized request.', 401);
  }
  const user = await UserModel.findOne({
    _id: payload.id,
    tokens: refreshToken,
  });
  // if user is compromised, remove all previous tokens, send err response
  if (!user) {
    await UserModel.findByIdAndUpdate(payload.id, { tokens: [] });
    return sendErrorResponse(res, 'Unauthorized request', 403);
  }
  // generate new refresh and access tokens
  const newAccessToken = jwt.sign({ id: user._id }, JWT_SECRET, {
    expiresIn: '15m',
  });
  const newRefreshToken = jwt.sign({ id: user._id }, JWT_SECRET);
  // remove old refresh token
  const filteredtokens = user.tokens.filter((token) => token !== refreshToken);
  user.tokens = filteredtokens;
  user.tokens.push(newRefreshToken);
  await user.save();

  res.json({
    tokens: {
      refresh: newRefreshToken,
      access: newAccessToken,
    },
  });
};

export const signOut: RequestHandler = async (req, res) => {
  // remove refresh token, check unauthorized
  const { refreshToken } = req.body;
  const user = await UserModel.findOne({
    _id: req.user.id,
    tokens: refreshToken,
  });
  if (!user)
    return sendErrorResponse(res, 'Unauthorized request, user not found.', 403);

  const newTokens = user.tokens.filter((t) => t !== refreshToken);
  user.tokens = newTokens;
  await user.save();

  res.send();
};

export const generateForgetPasswordLink: RequestHandler = async (req, res) => {
  console.log(process.env);
  // email from req.body
  const { email } = req.body;
  // find user, if not send 404
  const user = await UserModel.findOne({ email });
  if (!user) return sendErrorResponse(res, 'Account not found.', 404);
  // Remove any existing password reset tokens
  await PasswordResetTokenModel.findOneAndDelete({ owner: user._id });
  // create new token
  const token = crypto.randomBytes(36).toString('hex');
  await PasswordResetTokenModel.create({ owner: user._id, token });
  // send link to user email
  const passwordResetLink = `${process.env.PASSWORD_RESET_LINK}?id=${user._id}&token=${token}`;
  await mail.sendPasswordResetLink(user.email, passwordResetLink);

  // send res
  res.json({ message: 'Please check your email.' });
};

export const grantValid: RequestHandler = async (req, res) => {
  res.json({ valid: true });
};
