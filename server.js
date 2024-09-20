const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.MONGODB_DATABASE.replace(
  '<PASSWORD>',
  process.env.MONGODB_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((res) => {
    console.log('\n 🚀 MONGODB -> Connection successful. 🚀 \n');
  })
  .catch((err) => {
    console.log('Error: ', err);
  });

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
