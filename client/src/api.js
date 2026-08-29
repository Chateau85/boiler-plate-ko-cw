class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

async function request(path, options = {}) {
    const headers = new Headers(options.headers);

    if (options.body && !headers.has('content-type')) {
        headers.set('content-type', 'application/json');
    }

    const response = await fetch(path, {
        ...options,
        headers,
        credentials: 'same-origin',
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof data === 'object' && data?.message
            ? data.message
            : '요청을 처리하지 못했습니다.';
        throw new ApiError(message, response.status, data);
    }

    return data;
}

export function getHello() {
    return request('/api/hello');
}

export async function getAuthentication() {
    try {
        return await request('/api/users/auth');
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            return { isAuth: false };
        }

        throw error;
    }
}

export function loginUser(credentials) {
    return request('/api/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}

export function registerUser(registration) {
    return request('/api/users/register', {
        method: 'POST',
        body: JSON.stringify(registration),
    });
}

export function logoutUser() {
    return request('/api/users/logout', { method: 'POST' });
}

export { ApiError };
