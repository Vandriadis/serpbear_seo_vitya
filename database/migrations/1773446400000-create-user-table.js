// Migration: Creates user table for multi-user roles (admin, seo, viewer).

module.exports = {
   up: (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const tables = await queryInterface.showAllTables();
            const hasUser = tables.map((name) => String(name).toLowerCase()).includes('user');
            if (!hasUser) {
               await queryInterface.createTable('user', {
                  ID: {
                     type: Sequelize.DataTypes.INTEGER,
                     allowNull: false,
                     primaryKey: true,
                     autoIncrement: true,
                  },
                  username: {
                     type: Sequelize.DataTypes.STRING,
                     allowNull: false,
                     unique: true,
                  },
                  password: {
                     type: Sequelize.DataTypes.STRING,
                     allowNull: false,
                  },
                  role: {
                     type: Sequelize.DataTypes.STRING,
                     allowNull: false,
                     defaultValue: 'viewer',
                  },
                  created: {
                     type: Sequelize.DataTypes.STRING,
                     allowNull: true,
                  },
               }, { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
   down: (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const tables = await queryInterface.showAllTables();
            const hasUser = tables.map((name) => String(name).toLowerCase()).includes('user');
            if (hasUser) {
               await queryInterface.dropTable('user', { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
