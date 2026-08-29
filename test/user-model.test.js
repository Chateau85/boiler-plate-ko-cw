const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../server/models/User');

const jwtSecret = 'a-secure-test-secret-with-32-bytes';

test('User compares passwords and signs a token with the configured secret', async () => {
    const hashedPassword = await bcrypt.hash('strong-password', 4);
    const user = new User({
        name: '홍길동',
        email: 'user@example.com',
        password: hashedPassword,
    });
    user.save = async () => user;

    assert.equal(await user.comparePassword('strong-password'), true);
    assert.equal(await user.comparePassword('wrong-password'), false);

    const token = await user.generateToken(jwtSecret, '1h');
    const decoded = jwt.verify(token, jwtSecret);

    assert.equal(decoded.sub, user._id.toString());
    assert.ok(decoded.exp > decoded.iat);
});

test('User rejects a token signed with another secret', async () => {
    const token = jwt.sign(
        { sub: '507f1f77bcf86cd799439011' },
        'another-secure-test-secret-32-bytes',
    );

    assert.equal(await User.findByToken(token, jwtSecret), null);
});
