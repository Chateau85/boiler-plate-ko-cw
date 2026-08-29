import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../../api';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('비밀번호와 비밀번호 확인이 일치해야 합니다.');
            return;
        }

        setSubmitting(true);

        try {
            await registerUser({
                name: form.name,
                email: form.email,
                password: form.password,
            });
            navigate('/login');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="card">
            <p className="eyebrow">Create an account</p>
            <h1>회원가입</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="register-name">이름</label>
                <input
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    minLength="1"
                    maxLength="50"
                    required
                    value={form.name}
                    onChange={updateField}
                />

                <label htmlFor="register-email">이메일</label>
                <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={updateField}
                />

                <label htmlFor="register-password">비밀번호</label>
                <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength="8"
                    maxLength="128"
                    required
                    value={form.password}
                    onChange={updateField}
                />

                <label htmlFor="register-confirm-password">비밀번호 확인</label>
                <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength="8"
                    maxLength="128"
                    required
                    value={form.confirmPassword}
                    onChange={updateField}
                />

                {error && <p role="alert" className="error-message">{error}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? '가입 중…' : '회원가입'}
                </button>
            </form>
            <p className="form-footer">
                이미 계정이 있나요? <Link to="/login">로그인</Link>
            </p>
        </section>
    );
}
