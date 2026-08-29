import { Navigate, Route, Routes } from 'react-router-dom';
import AuthGate from './components/AuthGate';
import LandingPage from './components/views/LandingPage/LandingPage';
import LoginPage from './components/views/LoginPage/LoginPage';
import RegisterPage from './components/views/RegisterPage/RegisterPage';
import './App.css';

export default function App() {
    return (
        <main className="app-shell">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route
                    path="/login"
                    element={(
                        <AuthGate guestOnly>
                            <LoginPage />
                        </AuthGate>
                    )}
                />
                <Route
                    path="/register"
                    element={(
                        <AuthGate guestOnly>
                            <RegisterPage />
                        </AuthGate>
                    )}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </main>
    );
}
