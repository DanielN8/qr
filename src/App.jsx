import './App.css';
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AppScanner from './AppScanner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Componente para mostrar el QR generado y permitir su descarga
const QRCodeDisplay = memo(({ generatedQR, qrRef, handleDownload, isDownloading, handleClearQR }) => (
  <div className="QRCodeContainer">
    {generatedQR && (
      <>
        <div ref={qrRef}>
          <QRCode value={generatedQR} />
        </div>
        <div className="download-container">
          <button onClick={handleDownload} className="btn" disabled={isDownloading}>
            {isDownloading ? 'Descargando...' : 'Descargar QR'}
          </button>
        </div>
      </>
    )}
    {generatedQR && (
      <button onClick={handleClearQR} className="btn restablecer-btn">Restablecer QR</button>
    )}
  </div>
));

// Definir la tabla de asistencias
const AsistenciasTabla = memo(({ asistencias }) => (
  <table className="data-table">
    <thead>
      <tr>
        <th>Cédula</th>
        <th>Nombre</th>
        <th>Apellido</th>
        <th>Correo Institucional</th>
        <th>Facultad</th>
        <th>Carrera</th>
        <th>Fecha de Registro</th>
      </tr>
    </thead>
    <tbody>
      {/* Agregar los datos de las columnas de la base de datos a la tabla */}
      {asistencias.map((asistencia) => (
        <tr key={asistencia.CEDULA}>
          <td>{asistencia.CEDULA}</td>
          <td>{asistencia.NOMBRE}</td>
          <td>{asistencia.APELLIDO}</td>
          <td>{asistencia.CORREO_INSTITUCIONAL}</td>
          <td>{asistencia.FACULTAD}</td>
          <td>{asistencia.CARRERA}</td>
          <td>{asistencia.FECHA_DE_REGISTRO}</td>
        </tr>
      ))}
    </tbody>
  </table>
));

// Facultades y carreras
const Facultades = [
  "Ingeniería Civil",
  "Ingeniería Eléctrica",
  "Ingeniería Industrial",
  "Ingeniería Mecánica",
  "Ingeniería de Sistemas Computacionales",
  "Ciencias y Tecnología"
];

const Carreras = {
  "Ingeniería Civil": [
    "Licenciatura en Ingeniería en Administración de Proyectos de Construcción",
    "Licenciatura en Ingeniería Ambiental",
    "Licenciatura en Ingeniería Civil",
    "Licenciatura en Ingeniería Geológica",
    "Licenciatura en Ingeniería Geomática",
    "Licenciatura en Ingeniería Marítima Portuaria",
    "Licenciatura en Dibujo Automatizado",
    "Licenciatura en Edificaciones",
    "Licenciatura en Operaciones Marítimas y Portuarias",
    "Licenciatura en Saneamiento y Ambiente",
    "Licenciatura en Topografía"
  ],
  
  "Ingeniería Eléctrica": [
    "Licenciatura en Ingeniería Eléctrica",
    "Licenciatura en Ingeniería Eléctrica y Electrónica",
    "Licenciatura en Ingeniería Electromecánica",
    "Licenciatura en Ingeniería Electrónica y Telecomunicaciones",
    "Técnico en Ingeniería con especialización en Electrónica Biomédica",
    "Técnico en Ingeniería con especialización en Sistemas Eléctricos",
    "Técnico en Ingeniería con especialización en Telecomunicaciones"
  ],

  "Ingeniería Industrial": [
    "Licenciatura en Ingeniería Industrial",
    "Licenciatura en Ingeniería Logística y Cadena de Suministro",
    "Licenciatura en Ingeniería Mecánica Industrial",
    "Licenciatura en Ingeniería en Seguridad Industrial e Higiene Ocupacional",
    "Licenciatura en Gestión Administrativa",
    "Licenciatura en Gestión de la Producción Industrial",
    "Licenciatura en Logística y Transporte Multimodal",
    "Licenciatura en Mercadeo y Negocios Internacionales",
    "Licenciatura en Recursos Humanos y Gestión de la Productividad"
  ],

  "Ingeniería Mecánica": [
    "Licenciatura en Ingeniería Aeronáutica",
    "Licenciatura en Ingeniería de Energía y Ambiente",
    "Licenciatura en Ingeniería de Mantenimiento",
    "Licenciatura en Ingeniería Mecánica",
    "Licenciatura en Ingeniería Naval",
    "Licenciatura en Administración de Aviación",
    "Licenciatura en Administración de Aviación con opción a vuelo (Piloto)",
    "Licenciatura en Mecánica Automotriz",
    "Licenciatura en Mecánica Industrial",
    "Licenciatura en Refrigeración y Aire Acondicionado",
    "Licenciatura en Soldadura",
    "Técnico en Despacho de Vuelo",
    "Técnico en Ingeniería de Mantenimiento de Aeronaves con especialización en Motores y Fuselajes"
  ],
  
  "Ingeniería de Sistemas Computacionales": [
    "Licenciatura en Ingeniería de Sistemas de Información",
    "Licenciatura en Ingeniería de Sistemas de Información Gerencial",
    "Licenciatura en Ingeniería de Sistemas y Computación",
    "Licenciatura en Ingeniería de Software",
    "Licenciatura en Ciberseguridad",
    "Licenciatura en Ciencias de la Computación",
    "Licenciatura en Desarrollo y Gestión de Software",
    "Licenciatura en Informática Aplicada a la Educación",
    "Licenciatura en Redes Informáticas",
    "Técnico en Informática para la Gestión Empresarial"
  ],

  "Ciencias y Tecnología": [
    "Licenciatura en Ingeniería en Alimentos",
    "Licenciatura en Ingeniería Forestal",
    "Licenciatura en Comunicación Ejecutiva Bilingüe"
  ]
};

// Componente para generar QR
function GenerateQRPage() {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correoInstitucional, setCorreoInstitucional] = useState('');
  const [facultad, setFacultad] = useState('');
  const [carrera, setCarrera] = useState('');
  const [generatedQR, setQR] = useState(null);
  const qrRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errors, setErrors] = useState({});
  const [asistencias, setAsistencias] = useState([]);

  // Cargar asistencias al cargar la página
  useEffect(() => {
    cargarAsistenciasBD(setAsistencias);
  }, []);

  // Función para generar el QR
  const handleGenerateQR = async () => {
    const newErrors = {};
    if (!cedula) newErrors.cedula = 'Por favor, ingresa tu cédula.';
    if (!nombre) newErrors.nombre = 'Por favor, ingresa tu nombre.';
    if (!apellido) newErrors.apellido = 'Por favor, ingresa tu apellido.';
    if (!correoInstitucional) newErrors.correoInstitucional = 'Por favor, ingresa un correo electrónico institucional.';
    if (!facultad) newErrors.facultad = 'Por favor, selecciona una facultad.';
    if (!carrera) newErrors.carrera = 'Por favor, selecciona una carrera.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Generar datos para el QR
    const qrData = `${cedula}\n${nombre}\n${apellido}\n${correoInstitucional}\n${facultad}\n${carrera}`;
    setQR(qrData.trim());
    await cargarAsistenciasBD(setAsistencias);
  };

  // Función para descargar el QR
  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    toast.dismiss();
    toast.info('Se ha comenzado la descarga...', { autoClose: 2000 });

    if (qrRef.current) {
      try {
        const canvas = await html2canvas(qrRef.current, { backgroundColor: null });
        const paddedCanvas = document.createElement('canvas');
        const context = paddedCanvas.getContext('2d');

        const padding = 20; 
        paddedCanvas.width = canvas.width + padding * 2; 
        paddedCanvas.height = canvas.height + padding * 2; 
        context.fillStyle = 'white';
        context.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
        context.drawImage(canvas, padding, padding);

        const link = document.createElement('a');
        link.href = paddedCanvas.toDataURL('image/png');
        link.download = 'qr-code.png';
        link.click();
        setTimeout(() => setIsDownloading(false), 2000);
      } catch (error) {
        console.error('Error al generar la imagen del QR:', error);
        toast.error('Error al generar la imagen del QR.');
        setIsDownloading(false);
      }
    }
  };

  // Función para limpiar el QR
  const handleClearQR = () => {
    setCedula('');
    setNombre('');
    setApellido('');
    setCorreoInstitucional('');
    setFacultad('');
    setCarrera('');
    setQR(null);
    setErrors({});
  };

  return (
    <div className="tab-content">
      <h1>Generar QR</h1>
      <div className="input-container">
        <label>Cédula:</label>
        <input type="text" placeholder="Cédula" value={cedula} onChange={(e) => setCedula(e.target.value)} className="input-field" />
        {errors.cedula && <span className="error-message">{errors.cedula}</span>}
      </div>
      <div className="input-container">
        <label>Nombre:</label>
        <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="input-field" />
        {errors.nombre && <span className="error-message">{errors.nombre}</span>}
      </div>
      <div className="input-container">
        <label>Apellido:</label>
        <input type="text" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} className="input-field" />
        {errors.apellido && <span className="error-message">{errors.apellido}</span>}
      </div>
      <div className="input-container">
        <label>Correo Institucional:</label>
        <input type="email" placeholder="Correo Institucional" value={correoInstitucional} onChange={(e) => setCorreoInstitucional(e.target.value)} className="input-field" />
        {errors.correoInstitucional && <span className="error-message">{errors.correoInstitucional}</span>}
      </div>
      <div className="input-container">
        <label>Facultad:</label>
        <select value={facultad} onChange={(e) => {
          setFacultad(e.target.value);
          setCarrera(''); // Reiniciar carrera si facultad cambia
        }} className="input-field">
          <option value="">Seleccione una facultad</option>
          {Facultades.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {errors.facultad && <span className="error-message">{errors.facultad}</span>}
      </div>
      <div className="input-container">
        <label>Carrera:</label>
        <select value={carrera} onChange={(e) => setCarrera(e.target.value)} className="input-field" disabled={!facultad}>
          <option value="">Seleccione una carrera</option>
          {facultad && Carreras[facultad]?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {errors.carrera && <span className="error-message">{errors.carrera}</span>}
      </div>
      <button onClick={handleGenerateQR} className="btn">Generar QR</button>
      <QRCodeDisplay
        generatedQR={generatedQR}
        qrRef={qrRef}
        handleDownload={handleDownload}
        isDownloading={isDownloading}
        handleClearQR={handleClearQR}
      />
    </div>
  );
}

// Función para cargar asistencias desde la base de datos
async function cargarAsistenciasBD(setAsistencias) {
  try {
    const response = await fetch('http://localhost:3002/api/asistencias');
    if (!response.ok) {
      throw new Error('Error al cargar asistencias de la base de datos.');
    }

    const data = await response.json();
    setAsistencias(data);
  } catch (error) {
    console.error('Error al cargar asistencias:', error);
    toast.error('Error al cargar asistencias de la base de datos.');
  }
}

// Componente para escanear QR
function ScanQRPage() {
  const [asistencias, setAsistencias] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [notificationActive, setNotificationActive] = useState(false);

  const loadAsistencias = useCallback(async () => {
    await cargarAsistenciasBD(setAsistencias);
  }, []);

  useEffect(() => {
    loadAsistencias();
  }, [loadAsistencias]);

  const handleScan = (data) => {
    if (data) {
      const qrInfo = data.split('\n').map(line => line.trim());

      if (qrInfo.length < 6) {
        toast.error('Formato de QR inválido. Asegúrese de que todos los datos estén presentes.');
        return;
      }

      // Crear nuevo usuario
      const newUser = {
        CEDULA: qrInfo[0],
        NOMBRE: qrInfo[1],
        APELLIDO: qrInfo[2],
        CORREO_INSTITUCIONAL: qrInfo[3],
        FACULTAD: qrInfo[4],
        CARRERA: qrInfo[5],
        FECHA_DE_REGISTRO: new Date().toISOString(),
      };

      // Verificar si el usuario ya existe
      const asistenciaExistente = asistencias.find(asistencia => asistencia.CEDULA === newUser.CEDULA);

      if (asistenciaExistente) {
        if (!notificationActive) {
          setNotificationActive(true);
          toast.error('Este QR ya ha sido registrado.', {
            onClose: () => setNotificationActive(false),
          });
        }
      } else {
        setAsistencias(prevAsistencias => [...prevAsistencias, newUser]);
        toast.success('Usuario registrado exitosamente.');
        loadAsistencias();
      }
    } else {
      toast.error('No se pudo leer el código QR.');
    }
  };

  // Función para descargar la lista de asistencias en formato Excel o PDF
  const handleDownload = async (format) => {
    try {
      if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(asistencias);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');
        XLSX.writeFile(wb, 'lista-asistencias.xlsx');
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        doc.autoTable({
          head: [['Cédula', 'Nombre', 'Apellido', 'Correo Institucional', 'Facultad', 'Carrera', 'Fecha de Registro']],
          body: asistencias.map(asistencia => [
            asistencia.CEDULA,
            asistencia.NOMBRE,
            asistencia.APELLIDO,
            asistencia.CORREO_INSTITUCIONAL,
            asistencia.FACULTAD,
            asistencia.CARRERA,
            asistencia.FECHA_DE_REGISTRO,
          ]),
        });
        doc.save('lista-asistencias.pdf');
      } else {
        toast.error('Formato de descarga no soportado.');
      }
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      toast.error('Error al descargar el archivo.');
    }
  };

  // Componente para mostrar la página de escaneo
  return (
    <div className="tab-content">
      <h1>Escanear QR</h1>
      <AppScanner onScan={handleScan} />
      <div className="dropdown-container">
        <button onClick={() => setShowMenu(!showMenu)} className="btn">Descargar</button>
        {showMenu && (
          <div className="dropdown-menu">
            <button onClick={() => handleDownload('xlsx')} className="dropdown-item">Descargar Excel</button>
            <button onClick={() => handleDownload('pdf')} className="dropdown-item">Descargar PDF</button>
          </div>
        )}
      </div>
      <AsistenciasTabla asistencias={asistencias} />
    </div>
  );
}

// Componente principal de la aplicación App
function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="tabs">
            <Link to="/" className="tab">Generar QR</Link>
            <Link to="/escanear" className="tab">Escanear QR</Link>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<GenerateQRPage />} />
          <Route path="/escanear" element={<ScanQRPage />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;