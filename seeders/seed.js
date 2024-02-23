import bcrypt from 'bcryptjs'

import { db } from '../config/mongoose.js'
import { User } from '../models/user.js'

const seedUsers = [
  {
    name: 'user1',
    email: 'user1@example.com',
    password: '123456'
  },
  {
    name: 'user2',
    email: 'user2@example.com',
    password: '123456'
  }
]

db.once('open', async () => {
  try {
    seedUsers.forEach(user => { user.password = bcrypt.hashSync(user.password, 10) })

    const result = await User.bulkWrite([
      { insertOne: { document: seedUsers[0] } },
      { insertOne: { document: seedUsers[1] } }
    ])

    console.log('Seed Users already insert !')
    console.log('result: ', result)

    process.exit()
  } catch (error) {
    console.log(error)
    process.exit()
  }
})
