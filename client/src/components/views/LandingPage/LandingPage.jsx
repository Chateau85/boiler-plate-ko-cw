import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthentication, getHello, logoutUser } from '../../../api';

export default function LandingPage() {
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState('서버에 연결하고 있습니다.');
    const [isAuth, setIsAuth] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        Promise.all([getHello(), getAuthentication()])
            .then(([message, user]) => {
                if (active) {
                    setGreeting(message);
                    setIsAuth(user.isAuth);
                }
            })
            .catch(() => {
                if (active) {
                    setError('서버 상태를 확인하지 못했습니다.');
                }
            });

        return () => {
            active = false;
        };
    }, []);

    async function handleLogout() {
        setError('');

        try {
            await logoutUser();
            navigate('/login');
        } catch (requestError) {
            setError(requestError.message);
        }
    }

    return (
        <section className="card landing-card">
            <p className="eyebrow">MERN Authentication Study</p>
            <h1>시작 페이지</h1>
            <p>{greeting}</p>
            {error && <p role="alert" className="error-message">{error}</p>}

            <div className="actions">
                {isAuth ? (
                    <button type="button" onClick={handleLogout}>로그아웃</button>
                ) : (
                    <>
                        <Link className="button-link" to="/login">로그인</Link>
                        <Link className="button-link secondary" to="/register">회원가입</Link>
                    </>
                )}
            </div>
        </section>
    );
}
