import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthentication, registerUser } from './api';

function jsonResponse(status, data) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('API client', () => {
    it('maps a 401 authentication response to an anonymous user', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            jsonResponse(401, { isAuth: false }),
        ));

        await expect(getAuthentication()).resolves.toEqual({ isAuth: false });
    });

    it('sends only the registration fields as JSON', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            jsonResponse(201, { success: true }),
        );
        vi.stubGlobal('fetch', fetchMock);
        const registration = {
            name: '홍길동',
            email: 'user@example.com',
            password: 'strong-password',
        };

        await registerUser(registration);

        expect(fetchMock).toHaveBeenCalledWith('/api/users/register', expect.objectContaining({
            method: 'POST',
            credentials: 'same-origin',
            body: JSON.stringify(registration),
        }));
    });
});
