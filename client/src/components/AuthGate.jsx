import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthentication } from '../api';

export default function AuthGate({ children, guestOnly = false }) {
    const [state, setState] = useState({ loading: true, isAuth: false, error: '' });

    useEffect(() => {
        let active = true;

        getAuthentication()
            .then((user) => {
                if (active) {
                    setState({ loading: false, isAuth: user.isAuth, error: '' });
                }
            })
            .catch(() => {
                if (active) {
                    setState({
                        loading: false,
                        isAuth: false,
                        error: '인증 상태를 확인하지 못했습니다.',
                    });
                }
            });

        return () => {
            active = false;
        };
    }, []);

    if (state.loading) {
        return <p role="status">인증 상태를 확인하고 있습니다.</p>;
    }

    if (state.error) {
        return <p role="alert">{state.error}</p>;
    }

    if (guestOnly && state.isAuth) {
        return <Navigate to="/" replace />;
    }

    return children;
}
