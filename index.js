// import 'babel-polyfill';
// import express from 'express';
// import mongoose from 'mongoose';
// import bodyParser from 'body-parser';
// import { DATABASE_URL, PORT } './config'


const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { DATABASE_URL, PORT } = require('./config')

const HOST = process.env.HOST;
const PORT = 8080;

console.log(`Server running in ${process.env.NODE_ENV} mode` );

const app = express();
const jsonParser = bodyParser.json();

app.use(jsonParser);

mongoose.Promise = global.Promise;

app.get('/', (req, res) => {
  res.status(200).json({message: 'Hello from the server'})
})

let server;

function runServer(callback) {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err && callback) {
        console.log(err);
        return callback(err);
      }
    });
    server = app.listen(PORT, HOST, () => {
      console.log(`Your app is listening on port ${PORT}`);
      if (callback) {
        callback();
      }
      resolve(server);
    }).on('error', err => {
      reject(err);
    });
  });
}

function closeServer() {
  return new Promise((resolve, reject) => {
    console.log('Closing server');
    server.close(err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

if (require.main === module) {
  runServer();
}

module.exports = app;
