dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err)); 