import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import './AppScanner.css';
import { toast } from 'react-toastify';

function AppScanner({ onScan }) {
  const [cameraActive, setCameraActive] = useState(true);
  const [qrDetected, setQrDetected] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [canScan, setCanScan] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stream = useRef(null);
  const intervalRef = useRef(null);

  //Cargar usuarios
  const cargarUsuarios = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/asistencias');
      if (!response.ok) {
        throw new Error('Error al cargar usuarios.');
      }
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error: ' + error.message);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
      intervalRef.current = setInterval(scanQRCode, 500);
    } else {
      stopCamera();
      clearInterval(intervalRef.current);
    }

    return () => {
      stopCamera();
      clearInterval(intervalRef.current);
    };
  }, [cameraActive]);

  //Función para obtener la fecha y hora actual
  const obtenerFechaActual = () => {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const año = ahora.getFullYear();
    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12;
    horas = horas ? String(horas).padStart(2, '0') : '12';
    return `${dia}/${mes}/${año} ${horas}:${minutos} ${ampm}`;
  };

  //Función para manejar el escaneo del código QR
  const handleScan = async (data) => {
    if (!canScan) {
      toast.info('Espere antes de escanear nuevamente.');
      return;
    }

    setCanScan(false);
    setTimeout(() => setCanScan(true), 2000);

    if (data) {
      const lines = data.split('\n').map(line => line.trim());

      if (lines.length < 6) {
        toast.error('Formato de QR inválido. Se requieren al menos 6 elementos.');
        return;
      }
      //Extraer datos del código QR
      const CEDULA = lines[0];
      const NOMBRE = lines[1];
      const APELLIDO = lines[2];
      const CORREO_INSTITUCIONAL = lines[3];
      const FACULTAD = lines[4];
      const CARRERA = lines[5];
      const FECHA_DE_REGISTRO = obtenerFechaActual();

      //Crear objeto con los datos del usuario
      const nuevoUsuario = { CEDULA, NOMBRE, APELLIDO, CORREO_INSTITUCIONAL, FACULTAD, CARRERA, FECHA_DE_REGISTRO };

      const usuarioExistente = usuarios.find(usuario => usuario.CEDULA === CEDULA);
      if (usuarioExistente) {
        toast.error('Esta cédula ya ha sido registrada.');
        return;
      }

      //Enviar datos a la base de datos
      try {
        console.log('Datos a enviar:', nuevoUsuario);
        const response = await fetch('http://localhost:3002/api/asistencias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nuevoUsuario),
        });

        //Verificar si la respuesta fue exitosa
        if (!response.ok) {
          const errorResponse = await response.json();
          console.error('Error en la respuesta:', errorResponse);
          toast.error(errorResponse.error || 'Error al insertar usuario.');
          return;
        }
        
        //Actualizar la lista de usuarios
        setUsuarios(prevUsuarios => [...prevUsuarios, nuevoUsuario]);
        if (onScan) onScan(data);

        setQrDetected(true);
        setDetectionMessage('¡Cuenta registrada correctamente!');
        setTimeout(() => {
          setQrDetected(false);
        }, 3000);
      } catch (error) {
        console.error('Error al insertar usuario:', error);
        toast.error('Error al insertar usuario en la base de datos.');
      }
    } else {
      toast.error('No se pudo leer el código QR.');
    }
  };

  //Función para iniciar la cámara
  const startCamera = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream.current;
      }
    } catch (error) {
      console.error('No se pudo iniciar la cámara', error);
      toast.error('No se pudo iniciar la cámara');
    }
  };

  //Función para detener la cámara
  const stopCamera = () => {
    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
      stream.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  //Función para escanear el código QR
  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video && canvas && context) {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('El video no tiene un tamaño válido aún.');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        handleScan(code.data);
      } else {
        setQrDetected(false);
      }
    }
  };
  
  //Renderizar la aplicación de escáner de los códigos QR
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button type="button" onClick={() => setCameraActive(prev => !prev)} className="btn">
        {cameraActive ? 'Cerrar Cámara' : 'Abrir Cámara'}
      </button>
      {cameraActive && (
        <div className="scanner-container">
          <video ref={videoRef} autoPlay className="video-reflect" />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className={`frame ${qrDetected ? 'frame-detected' : ''}`}></div>
          {qrDetected && (
            <div className="qr-success-message" style={{ backgroundColor: '#28a745', color: 'white', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
              <p>{detectionMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AppScanner;