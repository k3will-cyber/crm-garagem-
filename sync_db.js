const db = require('./models');
db.sequelize.sync({ force: true })
  .then(() => {
    console.log('All tables created successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
