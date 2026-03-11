import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar'; 
import CompanyPanel from '../components/CompanyPanel'; 
import CambioPassword from './CambioPassword';
import { API_URL } from '../auth';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const isMobile = () => window.innerWidth <= 768;
    const [usuario, setUsuario] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile());
    const [empresaOpen, setEmpresaOpen] = useState(false);
    const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
    const navigate = useNavigate();

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const toggleEmpresa = () => setEmpresaOpen(!empresaOpen);

    // Cerrar sidebar en mobile al cambiar de ruta (via Outlet)
    useEffect(() => {
        if (isMobile() && sidebarOpen) {
            setSidebarOpen(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cerrar sidebar al redimensionar a mobile
    useEffect(() => {
        function handleResize() {
            if (window.innerWidth <= 768) {
                setSidebarOpen(false);
            }
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session || !session.usuario || !session.access_token) {
            navigate("/");
            return;
        }

        // Mostrar usuario de inmediato desde localStorage
        setUsuario(session.usuario);

        // Verificar si requiere cambio de contraseña
        if (session.requiere_cambio_password) {
            setMostrarCambioPassword(true);
        }

        // Cargar tema de la empresa seleccionada
        var idEmp = session.usuario.id_empresa;
        if (idEmp) {
            document.body.className = document.body.className.replace(/empresa-\d+/g, '').trim();
            document.body.classList.add('empresa-' + idEmp);
        }

        // Verificar token y refrescar datos del usuario desde la BD
        fetch(API_URL + '/auth/verificar', {
            headers: { 'Authorization': 'Bearer ' + session.access_token }
        }).then(function (res) {
            if (!res.ok) {
                localStorage.removeItem('session');
                navigate("/");
                return null;
            }
            return res.json();
        }).then(function (data) {
            if (data && data.usuario) {
                // Actualizar sesion con datos frescos de la BD
                var sessionActual = JSON.parse(localStorage.getItem('session'));
                if (sessionActual) {
                    sessionActual.usuario = data.usuario;
                    localStorage.setItem('session', JSON.stringify(sessionActual));
                    setUsuario(data.usuario);
                    window.dispatchEvent(new Event('session-updated'));
                }
            }
        }).catch(function () {
            localStorage.removeItem('session');
            navigate("/");
        });
    }, [navigate]);

    if (!usuario) return <p>Cargando sesión...</p>;

    return (
        <div className="dashboard-layout">
            {mostrarCambioPassword && (
                <CambioPassword onCambiado={() => setMostrarCambioPassword(false)} />
            )}
            <Header 
                onToggleMenu={toggleSidebar} 
                onToggleEmpresa={toggleEmpresa} 
                usuario={usuario} 
            />
            <div className="dashboard-body">
                <Sidebar 
                    isOpen={sidebarOpen} 
                    onToggleMenu={toggleSidebar} 
                />
                {/* Overlay para cerrar sidebar en mobile */}
                {sidebarOpen && (
                    <div 
                        className="sidebar-overlay" 
                        onClick={() => setSidebarOpen(false)} 
                    />
                )}
                <div className="workspace-area">
                    {!empresaOpen && (
                        <button className="toggle-panel-btn" onClick={toggleEmpresa}>
                            ◀
                        </button>
                    )}
                    <Outlet context={{ toggleEmpresa }} />
                </div>
                <CompanyPanel 
                    isOpen={empresaOpen} 
                    onClose={() => setEmpresaOpen(false)}
                    idRol={usuario.id_rol}
                    idAccs={usuario.id_accs}
                />
                {empresaOpen && (
                    <div 
                        className="aside-panel-overlay" 
                        onClick={() => setEmpresaOpen(false)} 
                    />
                )}
            </div>
        </div>
    );
}