const mongoose = require('mongoose')

const connectToDatabase = async () => {
  if (!process.env.MONGO_URI) {
    return Promise.resolve()
  }

  await mongoose.connect(process.env.MONGO_URI)
}

module.exports = { connectToDatabase }
