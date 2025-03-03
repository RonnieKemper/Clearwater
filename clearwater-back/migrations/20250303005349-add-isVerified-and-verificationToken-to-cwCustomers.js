'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('cwCustomers', 'isVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }).then(() => {
      return queryInterface.addColumn('cwCustomers', 'verificationToken', {
        type: Sequelize.STRING,
        allowNull: true
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('cwCustomers', 'isVerified').then(() => {
      return queryInterface.removeColumn('cwCustomers', 'verificationToken');
    });
  }
};
