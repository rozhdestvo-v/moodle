import express from 'express';
import bodyParser from 'body-parser';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import http from 'http';
import appSrc from '../app.js';

const app = appSrc(express, bodyParser, createReadStream, crypto, http);

export default app;