require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { createClient } = require('@libsql/client');
const app = express();
// Puerto del servidor único
const port = process.env.PORT || 3002;

// Definir cors para permitir que el frontend se comunique con el backend
app.use(cors());
app.use(express.json());

// Crear cliente de base de datos
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Conectar a la base de datos
(async () => {
    try {
        await db.execute('SELECT 1');
        console.log('Conexión a la base de datos exitosa.');
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error.message);
        process.exit(1);
    }
})();

// Función para manejar errores
const handleError = (res, message) => {
    console.error(message);
    res.status(500).json({ error: message });
};

// Obtener todos los usuarios registrados
app.get('/api/asistencias', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM ASISTENCIAS');
        res.json(result.rows);
    } catch (error) {
        handleError(res, 'Error al obtener usuarios desde la base de datos.');
    }
});

// Agregar un nuevo usuario
app.post('/api/asistencias', async (req, res) => {
    const { CEDULA, NOMBRE, APELLIDO, CORREO_INSTITUCIONAL, FACULTAD, CARRERA, FECHA_DE_REGISTRO } = req.body;

    if (!CEDULA || !NOMBRE || !APELLIDO || !CORREO_INSTITUCIONAL || !FACULTAD || !CARRERA || !FECHA_DE_REGISTRO) {
        return res.status(400).json({ error: 'Faltan datos para agregar el usuario.' });
    }

    try {
        // Verificar si la cédula ya existe
        const existingUser = await db.execute('SELECT CEDULA FROM ASISTENCIAS WHERE CEDULA = ?', [CEDULA]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'La cédula ya está registrada.' });
        }

        // Inserción del nuevo usuario en la base de datos
        await db.execute(`
            INSERT INTO ASISTENCIAS (CEDULA, NOMBRE, APELLIDO, CORREO_INSTITUCIONAL, FACULTAD, CARRERA, FECHA_DE_REGISTRO) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [CEDULA, NOMBRE, APELLIDO, CORREO_INSTITUCIONAL, FACULTAD, CARRERA, FECHA_DE_REGISTRO]
        );        
        res.status(201).json({ message: 'Usuario agregado correctamente.' });
    } catch (error) {
        console.error('Error al agregar el usuario:', error.message);
        handleError(res, 'Error al agregar el usuario a la base de datos.');
    }
});

// Verificación de Correos
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: '',
      pass: ''
    }
  });
  
  app.use(express.json());
  
  app.post('/send-verification', (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }
  
    const token = crypto.randomBytes(20).toString('hex');
    const expirationDate = Date.now() + 20 * 60 * 1000; 

    const mailOptions = {
      from: 'noreply@tu-dominio.com',
      to: email,
      subject: 'Verificación de correo electrónico',
      text: `Por favor, verifica tu correo electrónico usando el siguiente enlace: \n\n` +
            `http://tu-dominio.com/verify/${token} \n\n` +
            `Este enlace es válido por 20 minutos.`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ error: 'Error al enviar el correo' });
      }
      res.status(200).json({ message: 'Correo de verificación enviado' });
    });
  });

// Fin función del correo





// Iniciar el servidor con el puerto indicado
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});