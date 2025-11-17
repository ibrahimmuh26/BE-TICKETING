import express from 'express';
import authentication from './authentication';
import users from './users';
import tickets from './tickets';

const router = express.Router();

export default (): express.Router =>{
    authentication(router);
    users(router);
    tickets(router);
    return router;
}