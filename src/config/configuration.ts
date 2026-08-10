export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:123456@localhost:5433/restaurant_saas?schema=public',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '7d',
  },
  bcrypt: {
    saltRounds: 10,
  },
});
