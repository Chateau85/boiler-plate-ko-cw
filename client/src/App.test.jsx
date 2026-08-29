import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as api from './api';

vi.mock('./api', () => ({
    getAuthentication: vi.fn(),
    getHello: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    registerUser: vi.fn(),
}));

describe('App', () => {
    beforeEach(() => {
        api.getAuthentication.mockResolvedValue({ isAuth: false });
        api.getHello.mockResolvedValue('안녕하세요~');
        api.registerUser.mockResolvedValue({ success: true });
    });

    it('shows public navigation for an anonymous visitor', async () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>,
        );

        expect(await screen.findByText('안녕하세요~')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '회원가입' })).toBeInTheDocument();
    });

    it('submits the name with registration data', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter initialEntries={['/register']}>
                <App />
            </MemoryRouter>,
        );

        await screen.findByRole('heading', { name: '회원가입' });
        await user.type(screen.getByLabelText('이름'), '홍길동');
        await user.type(screen.getByLabelText('이메일'), 'user@example.com');
        await user.type(screen.getByLabelText('비밀번호', { selector: '#register-password' }), 'strong-password');
        await user.type(screen.getByLabelText('비밀번호 확인'), 'strong-password');
        await user.click(screen.getByRole('button', { name: '회원가입' }));

        expect(api.registerUser).toHaveBeenCalledWith({
            name: '홍길동',
            email: 'user@example.com',
            password: 'strong-password',
        });
    });
});
