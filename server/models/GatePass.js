// models/GatePass.js
const { ObjectId } = require("mongodb");
const { getDb } = require("../config/db"); // Import getDb function

const collectionName = "RegDetails";

class GatePass {
  static getCollection() {
    return getDb().collection(collectionName);
  }

  static async create(gatePassData) {
    return await this.getCollection().insertOne(gatePassData);
  }

  static async find(query = {}) {
    return await this.getCollection().find(query).toArray();
  }

  static async findById(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid Gate Pass ID format");
    }
    return await this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  static async update(id, updateData) {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid Gate Pass ID format");
    }
    return await this.getCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  }

  static async delete(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error("Invalid Gate Pass ID format");
    }
    return await this.getCollection().deleteOne({ _id: new ObjectId(id) });
  }

  static async count(query = {}) {
    return await this.getCollection().countDocuments(query);
  }
}

module.exports = GatePass;
