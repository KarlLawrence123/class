router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';

    if (email === adminEmail && password === adminPassword) {
        const token = jwt.sign(
            { role: 'admin' },
            process.env.JWT_SECRET || 'a6f5101e7c3804ec8fb4055f2eef26b2aaba14b8cce078f03fe5d25f43a763f8074abb237576f550636ca40fc4e0f51785a4ac85f36b20564f64069bf65b9ab8',
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
