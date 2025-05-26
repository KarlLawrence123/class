router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';

    if (email === adminEmail && password === adminPassword) {
        const token = jwt.sign(
            { role: 'admin' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        return res.json({
            message: 'Login successful',
            token
        });
    } else {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
});
