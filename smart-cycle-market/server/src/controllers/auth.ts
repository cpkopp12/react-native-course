import { RequestHandler } from 'express';
import UserModel from 'src/models/user';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import AuthVerificationTokenModel from 'src/models/verificationToken';
import { sendErrorResponse } from 'src/utils/helper';

export const createNewUser: RequestHandler = async (req, res) => {
  // read and check incoming data
  const { name, email, password } = req.body;
  if (!name) return sendErrorResponse(res, 'name is missing', 422);
  if (!email) return sendErrorResponse(res, 'email is missing', 422);
  if (!password) {
    return sendErrorResponse(res, 'password is missing', 422);
  }
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
