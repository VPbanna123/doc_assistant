import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
// import mongoose from 'mongoose';
import router from './routes/authRoutes';
import connectDB from './db/connectDb';
// import aiRouter from './routes/aiRoute'
import bodyParser from 'body-parser';
dotenv.config();

const app = express();
app.use(cors({ origin: '*', credentials: true }));  
app.use(express.json()); 
app.use(bodyParser.json()); 



app.use('/api/auth', router);


connectDB(); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('offer', offer => socket.broadcast.emit('offer', offer));
  socket.on('answer', answer => socket.broadcast.emit('answer', answer));
  socket.on('ice-candidate', candidate => socket.broadcast.emit('ice-candidate', candidate));

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
