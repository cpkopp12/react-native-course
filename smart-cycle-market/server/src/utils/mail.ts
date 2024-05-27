// IMPORTS ------
import nodemailer from 'nodemailer';

// set up nodemailer func
// nodemailer
const transport = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.MAIL_TRAP_USER,
    pass: process.env.MAIL_TRAP_PASSWORD,
  },
});

// send verification email
const sendVerification = async (email: string, link: string) => {
  await transport.sendMail({
    from: 'verification@myapp.com',
    to: email,
    html: `<h1>Please click <a href='${link}'>this link</a> to verify your account</h1>`,
  });
};

// send password reset email
const sendPasswordResetLink = async (email: string, link: string) => {
  await transport.sendMail({
    from: 'security@myapp.com',
    to: email,
    html: `<h1>Please click <a href='${link}'>this link</a> to update your password</h1>`,
  });
};

const mail = {
  sendVerification,
  sendPasswordResetLink,
};

export default mail;
