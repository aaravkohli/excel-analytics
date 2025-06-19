import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/excel-analytics-sphere';

async function listUsers() {
  await mongoose.connect(MONGODB_URI);
  const users = await User.find({}, 'name email role createdAt');
  console.log('All users:');
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}) | role: ${u.role} | created: ${u.createdAt}`);
  });
  await mongoose.disconnect();
}

listUsers().catch(err => {
  console.error('Error listing users:', err);
  process.exit(1);
}); 