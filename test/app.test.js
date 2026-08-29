const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, LOGIN_FAILURE_MESSAGE } = require('../server/app');

const config = {
    jwtSecret: 'a-secure-test-secret-with-32-bytes',
    jwtExpiresIn: '1h',
    cookieName: 'x_auth',
    cookieOptions: {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 1000,
    },
};

class MockUser {
    static saved = [];
    static loginUser = null;
    static authenticatedUser = null;
    static updates = [];

    constructor(data) {
        Object.assign(this, data);
        this._id = 'new-user-id';
    }

    async save() {
        MockUser.saved.push(this);
        return this;
    }

    static findOne() {
        return {
            select: async () => MockUser.loginUser,
        };
    }

    static async findByToken() {
        return MockUser.authenticatedUser;
    }

    static async updateOne(filter, update) {
        MockUser.updates.push({ filter, update });
    }
}

function resetMockUser() {
    MockUser.saved = [];
    MockUser.loginUser = null;
    MockUser.authenticatedUser = null;
    MockUser.updates = [];
}

async function withServer(run) {
    const app = createApp({
        User: MockUser,
        config,
        logger: { error() {} },
    });
    const server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const { port } = server.address();

    try {
        await run(`http://127.0.0.1:${port}`);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
}

test.beforeEach(resetMockUser);

test('register validates input and only persists allowed fields', async () => {
    await withServer(async (baseUrl) => {
        const invalidResponse = await fetch(`${baseUrl}/api/users/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: 'invalid', password: 'short' }),
        });
        assert.equal(invalidResponse.status, 400);

        const response = await fetch(`${baseUrl}/api/users/register`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                name: '홍길동',
                email: 'USER@example.com ',
                password: 'strong-password',
                role: 1,
                token: 'injected-token',
            }),
        });

        assert.equal(response.status, 201);
        assert.equal(MockUser.saved.length, 1);
        assert.equal(MockUser.saved[0].email, 'user@example.com');
        assert.equal(MockUser.saved[0].role, undefined);
        assert.equal(MockUser.saved[0].token, undefined);
    });
});

test('login uses a generic failure response', async () => {
    await withServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/users/login`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: 'missing@example.com', password: 'password' }),
        });
        const body = await response.json();

        assert.equal(response.status, 401);
        assert.equal(body.message, LOGIN_FAILURE_MESSAGE);
    });
});

test('login sets an HTTP-only same-site authentication cookie', async () => {
    MockUser.loginUser = {
        _id: 'existing-user-id',
        async comparePassword() { return true; },
        async generateToken(secret, expiresIn) {
            assert.equal(secret, config.jwtSecret);
            assert.equal(expiresIn, config.jwtExpiresIn);
            return 'signed-token';
        },
    };

    await withServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/users/login`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email: 'user@example.com', password: 'password' }),
        });
        const cookie = response.headers.get('set-cookie');

        assert.equal(response.status, 200);
        assert.match(cookie, /^x_auth=signed-token;/);
        assert.match(cookie, /HttpOnly/i);
        assert.match(cookie, /SameSite=Strict/i);
        assert.doesNotMatch(cookie, /Secure/i);
    });
});

test('auth rejects missing cookies and returns an authenticated user', async () => {
    await withServer(async (baseUrl) => {
        const unauthorized = await fetch(`${baseUrl}/api/users/auth`);
        assert.equal(unauthorized.status, 401);

        MockUser.authenticatedUser = {
            _id: 'existing-user-id',
            role: 0,
            email: 'user@example.com',
            name: '홍길동',
        };
        const authorized = await fetch(`${baseUrl}/api/users/auth`, {
            headers: { cookie: 'x_auth=signed-token' },
        });
        const body = await authorized.json();

        assert.equal(authorized.status, 200);
        assert.equal(body.isAuth, true);
        assert.equal(body.isAdmin, false);
    });
});

test('logout revokes the stored token and clears the cookie', async () => {
    MockUser.authenticatedUser = {
        _id: 'existing-user-id',
        role: 0,
    };

    await withServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/users/logout`, {
            method: 'POST',
            headers: { cookie: 'x_auth=signed-token' },
        });
        const cookie = response.headers.get('set-cookie');

        assert.equal(response.status, 200);
        assert.deepEqual(MockUser.updates[0], {
            filter: { _id: 'existing-user-id', token: 'signed-token' },
            update: { $unset: { token: 1 } },
        });
        assert.match(cookie, /^x_auth=;/);
        assert.match(cookie, /HttpOnly/i);
    });
});
