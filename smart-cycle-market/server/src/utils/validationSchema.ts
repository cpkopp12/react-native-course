import { isValidObjectId } from 'mongoose';
import * as yup from 'yup';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

// override .email()
yup.addMethod(yup.string, 'email', function validateEmail(message) {
  return this.matches(emailRegex, {
    message,
    name: 'email',
    excludeEmptyString: true,
  });
});

const password = {
  password: yup
    .string()
    .required('Password is missing')
    .min(8, 'Password should be atleast 8 characters long')
    .matches(
      passwordRegex,
      'Password is too simple, needs atleast one digit and one capital letter'
    ),
};
// newuser validation schema
export const newUserSchema = yup.object({
  name: yup.string().required('Name is missing'),
  email: yup.string().email('Invalid email').required('Email is missing'),
  ...password,
});

const tokenAndId = {
  id: yup.string().test({
    name: 'valid-id',
    message: 'Invalid user id',
    test: (value) => {
      return isValidObjectId(value);
    },
  }),
  token: yup.string().required('Token is missing'),
};

// verification token validation schema
export const verifyTokenSchema = yup.object({
  ...tokenAndId,
});

// reset password schema
export const resetPasswordSchema = yup.object({
  ...tokenAndId,
  ...password,
});
