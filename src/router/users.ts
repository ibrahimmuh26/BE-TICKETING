import { authenticate } from '../middleware/authenticate';
import { getAllUsers, updateUserRole } from '../controller/users'
import express, { Router } from 'express'
import { authorize } from '../middleware/authorize';


export default (router : express.Router) =>{

    router.get('/users', authenticate, authorize(['L1', 'L2', 'L3']), getAllUsers);
    router.patch('/users/:id/role', authenticate, authorize(['L3']), updateUserRole);

}