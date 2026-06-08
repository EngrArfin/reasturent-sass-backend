import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  mongoUri:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-saas',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
}));
