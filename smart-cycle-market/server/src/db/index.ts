import { connect } from 'mongoose';

// local connection -------------
const uri = 'mongodb://127.0.0.1:27017/smart-cycle-market';
connect(uri)
  .then(() => {
    console.log('db connected');
  })
  .catch((err) => {
    console.log('connection error: ', err.message);
  });
