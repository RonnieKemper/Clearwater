'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class cwCustomers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  cwCustomers.init({
    Id: DataTypes.INTEGER,
    FirstName: DataTypes.STRING,
    LastName: DataTypes.STRING,
    Email: DataTypes.STRING,
    Username: DataTypes.STRING,
    phonenumber: DataTypes.STRING,
    Password: DataTypes.STRING,
    Admin: DataTypes.BOOLEAN,
    zip: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'cwCustomers',
  });
  return cwCustomers;
};