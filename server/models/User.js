const { getDb } = require("../config/db");
const bcrypt = require("bcrypt");

const collectionName = "Users";

class User {
  static getCollection() {
    return getDb().collection(collectionName);
  }

  static async create({ email, password, name }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
    };
    await this.getCollection().insertOne(user);
    return user;
  }

  static async findByEmail(email) {
    return await this.getCollection().findOne({ email: email.toLowerCase() });
  }

  static async comparePassword(plain, hash) {
    return await bcrypt.compare(plain, hash);
  }
}

module.exports = User;
