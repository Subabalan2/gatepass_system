// models/Receipt.js
const { getDb } = require("../config/db"); // Import getDb function

const collectionName = "ApprovedReceipts";

class Receipt {
  static getCollection() {
    return getDb().collection(collectionName);
  }

  static async create(receiptData) {
    return await this.getCollection().insertOne(receiptData);
  }

  static async find(query = {}) {
    return await this.getCollection().find(query).toArray();
  }

  static async findOne(query = {}) {
    return await this.getCollection().findOne(query);
  }

  static async findRecentlyApproved(limit = 10) {
    return await this.getCollection()
      .find({})
      .sort({ approvalDate: -1 })
      .limit(limit)
      .toArray();
  }

  static async count(query = {}) {
    return await this.getCollection().countDocuments(query);
  }

  static async deleteByApprovalId(approvalId) {
    return await this.getCollection().deleteOne({ approvalId });
  }
}

module.exports = Receipt;
