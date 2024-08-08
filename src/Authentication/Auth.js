const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: '',
    pass: ''
  }
});

const sendVerificationEmail = (to, token) => {
  const mailOptions = {
    from: 'noreply@tu-dominio.com',
    to: to,
    subject: 'Verificación de correo electrónico',
    text: `Por favor, verifica tu correo electrónico usando el siguiente enlace: \n\n` +
          `http://noreply/verify/${token} \n\n` +
          `Este enlace es válido por 20 minutos.`
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
