import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma"

export interface AuthRequest extends Request {
  user?:{
    id:string
    role:string
    email:string
  }
}

export async function authMiddleware(req:AuthRequest , res:Response,next :NextFunction):Promise<void>{
  try{
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    console.log("TOKEN ->" , token)

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as unknown as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where :{id:payload.userId},
      select:{
        id:true,
        role:true,
        email:true
      }
    })

    console.log("USER ->" , user)

    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    req.user = user
    next()

  }catch(error){
    res.status(401).json({ error: 'Invalid or expired token' })
    console.log(error)
  }
}


export function requireAdmin(req:AuthRequest , 
  res:Response,
  next:NextFunction
):void{
  if(req.user?.role !== 'ADMIN'){
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}