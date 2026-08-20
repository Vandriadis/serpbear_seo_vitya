// Migration: Adds alive/health-check fields to domain table.

module.exports = {
   up: (queryInterface, Sequelize) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const domainTableDefinition = await queryInterface.describeTable('domain');
            if (domainTableDefinition && !domainTableDefinition.alive) {
               await queryInterface.addColumn('domain', 'alive', { type: Sequelize.DataTypes.BOOLEAN, allowNull: true, defaultValue: null }, { transaction: t });
            }
            if (domainTableDefinition && !domainTableDefinition.alive_checked_at) {
               await queryInterface.addColumn('domain', 'alive_checked_at', { type: Sequelize.DataTypes.STRING, allowNull: true, defaultValue: '' }, { transaction: t });
            }
            if (domainTableDefinition && !domainTableDefinition.alive_status_code) {
               await queryInterface.addColumn('domain', 'alive_status_code', { type: Sequelize.DataTypes.INTEGER, allowNull: true, defaultValue: null }, { transaction: t });
            }
            if (domainTableDefinition && !domainTableDefinition.alive_error) {
               await queryInterface.addColumn('domain', 'alive_error', { type: Sequelize.DataTypes.STRING, allowNull: true, defaultValue: '' }, { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
   down: (queryInterface) => {
      return queryInterface.sequelize.transaction(async (t) => {
         try {
            const domainTableDefinition = await queryInterface.describeTable('domain');
            if (domainTableDefinition && domainTableDefinition.alive) {
               await queryInterface.removeColumn('domain', 'alive', { transaction: t });
            }
            if (domainTableDefinition && domainTableDefinition.alive_checked_at) {
               await queryInterface.removeColumn('domain', 'alive_checked_at', { transaction: t });
            }
            if (domainTableDefinition && domainTableDefinition.alive_status_code) {
               await queryInterface.removeColumn('domain', 'alive_status_code', { transaction: t });
            }
            if (domainTableDefinition && domainTableDefinition.alive_error) {
               await queryInterface.removeColumn('domain', 'alive_error', { transaction: t });
            }
         } catch (error) {
            console.log('error :', error);
         }
      });
   },
};
