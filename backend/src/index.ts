import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import behaviorRoutes from './routes/behavior.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tinyleap';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/behaviors', behaviorRoutes);

// Database connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    console.warn('Proceeding without MongoDB. Database features will fail.');
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
