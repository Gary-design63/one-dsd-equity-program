const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>{
  res.json({status:'ok', service:'one-dsd-api'});
});

app.get('/health', (req,res)=>{
  res.json({status:'healthy'});
});

const port = process.env.PORT || 3001;
app.listen(port, ()=>{
  console.log('API running on port', port);
});