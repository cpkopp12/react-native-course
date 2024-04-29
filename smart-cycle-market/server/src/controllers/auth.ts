import { RequestHandler } from 'express';
import UserModel from 'src/models/user';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import AuthVerificationTokenModel from 'src/models/verificationToken';

export const createNewUser: RequestHandler = async (req, res) => {
  // read and check incoming data
  const { name, email, password } = req.body;
  if (!name) return res.status(422).json({ message: 'Name is missing' });
  if (!email) return res.status(422).json({ message: 'email is missing' });
  if (!password) {
    return res.status(422).json({ message: 'password is missing' });
  }
  // check if user exists, either create or send message
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return res
      .status(401)
      .json({ message: 'Unauthorized request, email in use' });
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
