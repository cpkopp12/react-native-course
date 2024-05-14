// IMPORTS ------------------------------------
import { RequestHandler } from 'express';
import UserModel from 'src/models/user';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import AuthVerificationTokenModel from 'src/models/verificationToken';
import { sendErrorResponse } from 'src/utils/helper';
import jwt from 'jsonwebtoken';

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
  const link = `http://localhost:8000/verify?id=${newUser._id}&token=${token}`;

  // nodemailer
  const transport = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '3aa047ef44a768',
      pass: '5719fcc551ced6',
    },
  });

  await transport.sendMail({
    from: 'verification@myapp.com',
    to: newUser.email,
    html: `<h1>Please click <a href='${link}'>this link</a> to verify your account</h1>`,
  });

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
  const accessToken = jwt.sign(payload, 'secret', {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign(payload, 'secret');

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
