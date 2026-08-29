const MINIMUM_JWT_SECRET_BYTES = 32;

function requireValue(environment, name) {
    const value = environment[name]?.trim();

    if (!value) {
        throw new Error(`${name} environment variable is required`);
    }

    return value;
}

function readPositiveInteger(environment, name, fallback) {
    const rawValue = environment[name];

    if (rawValue === undefined) {
        return fallback;
    }

    const value = Number(rawValue);

    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer`);
    }

    return value;
}

function loadConfig(environment = process.env) {
    const nodeEnv = environment.NODE_ENV?.trim() || 'development';
    const jwtSecret = requireValue(environment, 'JWT_SECRET');

    if (Buffer.byteLength(jwtSecret, 'utf8') < MINIMUM_JWT_SECRET_BYTES) {
        throw new Error(`JWT_SECRET must be at least ${MINIMUM_JWT_SECRET_BYTES} bytes`);
    }

    const cookieMaxAgeMs = readPositiveInteger(
        environment,
        'AUTH_COOKIE_MAX_AGE_MS',
        60 * 60 * 1000,
    );

    return Object.freeze({
        nodeEnv,
        isProduction: nodeEnv === 'production',
        port: readPositiveInteger(environment, 'PORT', 5000),
        mongoUri: requireValue(environment, 'MONGO_URI'),
        jwtSecret,
        jwtExpiresIn: environment.JWT_EXPIRES_IN?.trim() || '1h',
        cookieName: 'x_auth',
        cookieOptions: Object.freeze({
            httpOnly: true,
            secure: nodeEnv === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: cookieMaxAgeMs,
        }),
    });
}

module.exports = { loadConfig, MINIMUM_JWT_SECRET_BYTES };
