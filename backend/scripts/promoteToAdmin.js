import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/excel-analytics-sphere';

async function promoteToAdmin() {
  await mongoose.connect(MONGODB_URI);
  const email = 'admin@example.com';

  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found:', email);
    await mongoose.disconnect();
    return;
  }

  user.role = 'admin';
  await user.save();
  console.log('User promoted to admin:', user.email, 'role:', user.role);
  await mongoose.disconnect();
}

promoteToAdmin().catch(err => {
  console.error('Error promoting user:', err);
  process.exit(1);
}); 