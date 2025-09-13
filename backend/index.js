require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const app = express();
app.use(cors({
  origin: ['http://localhost:5173', 'https://pdf-annonator-zlre.vercel.app/'],
  credentials: true
}));
// app.options('*', cors()); // Removed due to PathError crash
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));



// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// PDF routes
const pdfRoutes = require('./routes/pdf');
app.use('/api/pdf', pdfRoutes);


// Highlight routes
const highlightRoutes = require('./routes/highlight');
app.use('/api/highlight', highlightRoutes);

// Placeholder route
app.get('/', (req, res) => {
  res.send('PDF Annotator Backend Running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
