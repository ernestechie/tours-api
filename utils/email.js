const nodemailer = require('nodemailer');
const { MailtrapTransport } = require('mailtrap');

const TOKEN = process.env.MAILTRAP_API_TOKEN;

exports.natoursSendEmail = async ({ recipients, subject, text }) => {
  const transporter = nodemailer.createTransport(
    MailtrapTransport({
      token: TOKEN,
      testInboxId: 3153576,
    }),
  );

  const sender = {
    address: 'officialisaiahovie@gmail.com',
    name: 'Natours API',
  };

  try {
    const mailService = await transporter.sendMail({
      from: sender,
      to: recipients,
      subject,
      text,
      category: 'Integration Test',
      sandbox: true,
    });

    if (!mailService.success) throw new Error(mailService.errors);
    return mailService;
  } catch (err) {
    console.error(err);
  }
};
