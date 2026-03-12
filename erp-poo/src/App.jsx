import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './modules/Login';
import Dashboard from './modules/Dashboard';
import DashboardHome from './modules/DashboardHome';
import RRHH from './modules/RRHH';
import PersonalDetalle from './modules/PersonalDetalle';
import AsistenciasGeneral from './modules/AsistenciasGeneral';
import HorariosRRHH from './modules/HorariosRRHH';
import EquiposCrear from './modules/EquiposCrear';
import EquiposAsignar from './modules/EquiposAsignar';
import IngresarTicket from './modules/IngresarTicket';
import Tickets from './modules/Tickets';
import GestionPermisos from './modules/GestionPermisos';
import Chips from './modules/Chips';
import './styles/DarkMode.css';
import './styles/TemaEmpresa1.css';
import './styles/TemaEmpresa2.css';
import './styles/TemaEmpresa3.css';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
        <div className='App'>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />}>
                        <Route index element={<DashboardHome />} />
                        <Route path="mi-perfil" element={<PersonalDetalle />} />
                        <Route path="personal" element={<RRHH />} />
                        <Route path="personal/:id" element={<PersonalDetalle />} />
                        <Route path="asistencias" element={<AsistenciasGeneral />} />
                        <Route path="horarios" element={<HorariosRRHH />} />
                        <Route path="equipos/crear" element={<EquiposCrear />} />
                        <Route path="equipos/asignacion" element={<EquiposAsignar />} />
                        <Route path="tickets" element={<Tickets />} />
                        <Route path="tickets/nuevo" element={<IngresarTicket />} />
                        <Route path="permisos" element={<GestionPermisos />} />
                        <Route path="chips" element={<Chips />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </div>
        </QueryClientProvider>
    );
}

export default App;