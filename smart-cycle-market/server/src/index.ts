// IMPORTS ------------------------------
import 'src/db';
import express from 'express';
import authRouter from 'routes/auth';

// EXPRESS SERVER --------------------------------------
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API ROUTES
app.use('/auth', authRouter);

app.listen(8000, () => {
  console.log('server running on http://localhost:8000');
});
