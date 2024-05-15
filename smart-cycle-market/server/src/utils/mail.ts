// IMPORTS ------
import nodemailer from 'nodemailer';

// set up nodemailer func
// nodemailer
const transport = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '3aa047ef44a768',
    pass: '5719fcc551ced6',
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

const mail = {
  sendVerification,
};

export default mail;
