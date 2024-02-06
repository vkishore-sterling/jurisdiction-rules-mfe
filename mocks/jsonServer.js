/* eslint-disable no-console */
const jsonServer = require('json-server');
const chalk = require('chalk');
const server = jsonServer.create();
const middlewares = jsonServer.defaults();
const db = require('./db');

const router = jsonServer.router(db());

server.use(middlewares);
server.use(jsonServer.rewriter({
  '/fake/things/:id': '/fakeThings/:id',
}));

server.use(jsonServer.bodyParser);

server.use(router);
server.listen(3006, () => {
  console.log();
  console.log('JSON Server is running');
  console.log();
  console.log(`  ${chalk.cyan('http://localhost:3006')}`);
  console.log();
  console.log();
});