import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/socket-practice-db'
const { Schema } = mongoose

mongoose.connect(MONGODB_URI)

const db = mongoose.connection

db.on('error', () => { console.log('MongoDB connect fail !') })
db.once('open', () => { console.log('MongoDB already connected !') })

export { Schema, mongoose, db }
