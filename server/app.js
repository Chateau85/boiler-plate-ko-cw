const express = require('express');
const cookieParser = require('cookie-parser');
const { createAuthMiddleware } = require('./middleware/auth');

const LOGIN_FAILURE_MESSAGE = '이메일 또는 비밀번호를 확인해주세요.';

function normalizeRegistration(body = {}) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const lastname = typeof body.lastname === 'string' ? body.lastname.trim() : undefined;

    if (!name || name.length > 50) {
        return { error: '이름을 1자 이상 50자 이하로 입력해주세요.' };
    }

    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
        return { error: '올바른 이메일 주소를 입력해주세요.' };
    }

    if (password.length < 8 || password.length > 128) {
        return { error: '비밀번호를 8자 이상 128자 이하로 입력해주세요.' };
    }

    return {
        value: {
            email,
            password,
            name,
            ...(lastname ? { lastname } : {}),
        },
    };
}

function cookieOptionsWithoutLifetime(cookieOptions) {
    const { maxAge, ...clearOptions } = cookieOptions;
    return clearOptions;
}

function createApp({ User, config, logger = console }) {
    const app = express();
    const auth = createAuthMiddleware({
        User,
        jwtSecret: config.jwtSecret,
        cookieName: config.cookieName,
    });

    app.disable('x-powered-by');
    app.use(express.urlencoded({ extended: false, limit: '10kb' }));
    app.use(express.json({ limit: '10kb' }));
    app.use(cookieParser());

    app.get('/', (req, res) => res.send('Hello World!~~안녕하세요 ~'));
    app.get('/api/hello', (req, res) => res.send('안녕하세요~'));

    app.post('/api/users/register', async (req, res, next) => {
        try {
            const registration = normalizeRegistration(req.body);

            if (registration.error) {
                return res.status(400).json({ success: false, message: registration.error });
            }

            const user = new User(registration.value);
            await user.save();
            return res.status(201).json({ success: true });
        } catch (error) {
            if (error?.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: '이미 등록된 이메일입니다.',
                });
            }

            return next(error);
        }
    });

    app.post('/api/users/login', async (req, res, next) => {
        try {
            const email = typeof req.body?.email === 'string'
                ? req.body.email.trim().toLowerCase()
                : '';
            const password = typeof req.body?.password === 'string' ? req.body.password : '';
            const user = email
                ? await User.findOne({ email }).select('+password')
                : null;

            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({
                    loginSuccess: false,
                    message: LOGIN_FAILURE_MESSAGE,
                });
            }

            const token = await user.generateToken(
                config.jwtSecret,
                config.jwtExpiresIn,
            );

            return res
                .cookie(config.cookieName, token, config.cookieOptions)
                .status(200)
                .json({ loginSuccess: true, userId: user._id });
        } catch (error) {
            return next(error);
        }
    });

    app.get('/api/users/auth', auth, (req, res) => res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role !== 0,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image,
    }));

    app.post('/api/users/logout', auth, async (req, res, next) => {
        try {
            await User.updateOne(
                { _id: req.user._id, token: req.token },
                { $unset: { token: 1 } },
            );

            return res
                .clearCookie(
                    config.cookieName,
                    cookieOptionsWithoutLifetime(config.cookieOptions),
                )
                .status(200)
                .json({ success: true });
        } catch (error) {
            return next(error);
        }
    });

    app.use((error, req, res, next) => {
        logger.error(error);

        if (res.headersSent) {
            return next(error);
        }

        return res.status(500).json({
            success: false,
            message: '요청을 처리하지 못했습니다.',
        });
    });

    return app;
}

module.exports = { createApp, normalizeRegistration, LOGIN_FAILURE_MESSAGE };
