import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../../api';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await loginUser({ email, password });
            navigate('/');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="card">
            <p className="eyebrow">Welcome back</p>
            <h1>로그인</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="login-email">이메일</label>
                <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />

                <label htmlFor="login-password">비밀번호</label>
                <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />

                {error && <p role="alert" className="error-message">{error}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? '로그인 중…' : '로그인'}
                </button>
            </form>
            <p className="form-footer">
                계정이 없나요? <Link to="/register">회원가입</Link>
            </p>
        </section>
    );
}
