require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

if (env === 'production') {
  require('dotenv').config({ path: '.env.production' });
} else {
  require('dotenv').config({ path: '.env.development' });
}
const config = {
  httpPort: process.env.HTTP_PORT || 8080,
  rabbitServer: process.env.RABBITMQ_SERVER,
  nameService: process.env.DEFAULT_NAME_WORKER,
  dialectDB: process.env.DIALECT_DB,
  hostDB: process.env.HOST_DB,
  portDB: process.env.PORT_DB,
  userDB: process.env.USER_DB,
  passwordDB: process.env.PASSWORD_DB,
  nameDB: process.env.NAME_DB,
  secondsWaittingPerMessage: process.env.SECONDS_WAITING_PER_MESSAGE,
  pathFileLogs: process.env.PATH_FILE_LOGS,
};

module.exports = config;
