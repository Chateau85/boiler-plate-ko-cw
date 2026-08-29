const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../server/config/key');

const validEnvironment = {
    MONGO_URI: 'mongodb://127.0.0.1:27017/boiler-plate',
    JWT_SECRET: 'a-secure-test-secret-with-32-bytes',
};

test('loadConfig requires MongoDB and JWT settings', () => {
    assert.throws(() => loadConfig({}), /JWT_SECRET/);
    assert.throws(
        () => loadConfig({ JWT_SECRET: validEnvironment.JWT_SECRET }),
        /MONGO_URI/,
    );
});

test('loadConfig rejects short JWT secrets', () => {
    assert.throws(
        () => loadConfig({ ...validEnvironment, JWT_SECRET: 'too-short' }),
        /at least 32 bytes/,
    );
});

test('loadConfig enables secure cookies in production', () => {
    const config = loadConfig({
        ...validEnvironment,
        NODE_ENV: 'production',
        PORT: '8080',
        AUTH_COOKIE_MAX_AGE_MS: '7200000',
    });

    assert.equal(config.port, 8080);
    assert.equal(config.cookieOptions.secure, true);
    assert.equal(config.cookieOptions.httpOnly, true);
    assert.equal(config.cookieOptions.sameSite, 'strict');
    assert.equal(config.cookieOptions.maxAge, 7200000);
});
