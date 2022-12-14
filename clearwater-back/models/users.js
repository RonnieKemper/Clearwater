'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
//   class users extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//     }
//   }
//   users.init({
//     UserId: DataTypes.INTEGER,
//     FirstName: DataTypes.STRING,
//     LastName: DataTypes.STRING,
//     Email: DataTypes.STRING,
//     Username: DataTypes.STRING,
//     Password: DataTypes.STRING,
//     Admin: DataTypes.BOOLEAN
//   }, {
//     sequelize,
//     modelName: 'users',
//   });
//   return users;
// };
  var users = sequelize.define(
    'users',
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
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      Admin: DataTypes.BOOLEAN
    },
    {}
  );

  return users;
  };