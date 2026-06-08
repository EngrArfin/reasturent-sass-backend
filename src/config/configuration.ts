export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    mongoUri:
      process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-saas',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '7d',
  },
  bcrypt: {
    saltRounds: 10,
  },
});
