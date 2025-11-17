import express from 'express';
import http from 'http';
import bodyparser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import router from './router';

dotenv.config();

const MONGO_URL = process.env.MONGO_CLOUD_URI || process.env.MONGO_LOCAL_URI || '' ;


const app = express();

app.use(cors({
    credentials: true,
}));
app.use(compression());
app.use(cookieParser());
app.use(bodyparser.json());

const server = http.createServer(app);

server.listen(8021, () => {
    console.log('Server is running on port 8021');
});

// const MONGO_URL='mongodb://localhost:27017/ticketing';
// const MONGO_URL='mongodb+srv://ibrahimmuh26_db_user:hCZY7sehenGkJIZg@ticketing.9ackbf5.mongodb.net/ticketing?appName=ticketing';

mongoose.connect(MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('MongoDB Error:', error.message));


app.use('/',router());