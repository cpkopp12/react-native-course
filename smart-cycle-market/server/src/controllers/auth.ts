import { RequestHandler } from 'express';
import UserModel from 'src/models/user';
import crypto from 'crypto';
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

  return res.send(link);
};
