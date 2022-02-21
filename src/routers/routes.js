const express = require('express');
const controller = require('../controllers/controller');
const routes = express();

routes.get('/contas', controller.listAccounts);
routes.post('/contas', controller.createAccount);
routes.put('/contas/:numeroConta/usuario', controller.updateAccount);
routes.delete('/contas/:numeroConta', controller.deleteAccount);
routes.post('/transacoes/depositar', controller.deposit);
routes.post('/transacoes/sacar', controller.withdrawMoney);
routes.post('/transacoes/transferir', controller.transfer);
routes.get('/contas/saldo', controller.balance);
routes.get('/contas/extrato', controller.extract);

module.exports = routes;

