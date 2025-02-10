// 'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
//   class cwCustomers extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//     }
//   }
  // cwCustomers.init({
  //   UserId: {
  //     allowNull: false,
  //     autoIncrement: true,
  //     primaryKey: true,
  //     type: DataTypes.INTEGER
  //   },
  //   FirstName: DataTypes.STRING,
  //   LastName: DataTypes.STRING,
  //   Email: DataTypes.STRING,
  //   Username: DataTypes.STRING,
  //   Password: DataTypes.STRING,
  //   phonenumber: DataTypes.STRING,
  //   Admin: DataTypes.BOOLEAN,
  //   zip: DataTypes.STRING,
  // }, {
  //   sequelize,
  //   modelName: 'cwCustomers',
  // });
  // return cwCustomers;

var cwCustomers = sequelize.define(
  'cwCustomers',
  {
    UserId: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    FirstName: DataTypes.STRING,
    LastName: DataTypes.STRING,
    Email: {
      type: DataTypes.STRING,
      unique: true
    },
    Username: {
      type: DataTypes.STRING,
      unique: true
    },
    Password: DataTypes.STRING,
    phonenumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    zip: DataTypes.STRING,
      
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    Admin: DataTypes.BOOLEAN
  },
  {}
);

return cwCustomers;
//   };
};