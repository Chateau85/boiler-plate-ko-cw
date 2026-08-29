function createAuthMiddleware({ User, jwtSecret, cookieName }) {
    return async function authenticate(req, res, next) {
        try {
            const token = req.cookies?.[cookieName];

            if (!token) {
                return res.status(401).json({ isAuth: false });
            }

            const user = await User.findByToken(token, jwtSecret);

            if (!user) {
                return res.status(401).json({ isAuth: false });
            }

            req.token = token;
            req.user = user;
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

module.exports = { createAuthMiddleware };
