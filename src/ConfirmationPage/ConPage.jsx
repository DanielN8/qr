import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';
import './ConPage.css';

const ConPage = () => {
  const location = useLocation();
  const { cedula, nombre, apellido, correoInstitucional, facultad, carrera, generatedQR } = location.state || {};

  const [isDownloadEnabled, setIsDownloadEnabled] = useState(true); // Estado para controlar la descarga
  const [toastId, setToastId] = useState(null); // Estado para controlar la notificación

  const handleDownload = async () => {
    if (!isDownloadEnabled) {
      return;
    }
  
    const qrCodeElement = document.getElementById('qr-code');
    if (qrCodeElement) {
      try {
        qrCodeElement.style.border = '10px solid white';        
        const qrCanvas = await html2canvas(qrCodeElement, {
          useCORS: true,
          backgroundColor: 'white',
        });
        
        const link = document.createElement('a');
        link.href = qrCanvas.toDataURL('image/png');
        link.download = 'qr-code.png';
        link.click();
        
        const id = toast.success('Código QR descargado exitosamente.', {
          autoClose: 2000,
        });
        setToastId(id);
        
        setIsDownloadEnabled(false);
        qrCodeElement.style.border = '';
  
        setTimeout(() => {
          setIsDownloadEnabled(true);
        }, 2000);
      } catch (error) {
        console.error('Error al generar la imagen del QR:', error);
        if (!toast.isActive(toastId)) {
          toast.error('Error al descargar el QR.', {
            autoClose: 2000,
          });
        }
      }
    }
  };

  return (
    <div className="ConPage">
      <div>
        <h2>¡Registro exitoso!</h2>
      </div>

      <div className="confirmation-page">
        <div className="confirmation-details">
          <div className="qr-code-container" id="qr-code">
            {generatedQR && <QRCode value={generatedQR} size={150} />}
          </div>
          <div className="download-container">
            <button onClick={handleDownload} className="btn">Descargar QR</button>
          </div>
          <h3>Información personal</h3>
          <div className="informacion-personal">
            <p><strong>Estudiante: </strong>{nombre} {apellido}</p>
            <p><strong>Cédula:</strong> {cedula}</p>
            <p><strong>Correo Institucional:</strong> {correoInstitucional}</p>
            <p><strong>Facultad:</strong> {facultad}</p>
            <p><strong>Carrera: </strong>{carrera}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConPage;