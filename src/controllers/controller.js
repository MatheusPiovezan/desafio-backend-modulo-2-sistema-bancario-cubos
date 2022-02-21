const { format } = require('date-fns');
let { contas, saques, depositos, transferencias } = require('../bancodedados');

let accountNumber = 1;

const listAccounts = (req, res) => {
    const password = req.query.senha_banco;

    if (password) {
        if (password === 'Cubos123Bank') {
            if (contas.length) {
                return res.status(200).json(contas);
            } else {
                return res.status(204).json();
            }
        } else {
           return res.status(403).json({message: 'SENHA INVÁLIDA'});
        }
    } else {
        return res.status(401).json({message: 'SENHA PRECISA SER PREENCHIDA'});
    }
};

const createAccount = (req, res) => {
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body
    
    const checkEmailCpf = contas.find((item) => {
        return item.usuario.cpf === cpf || item.usuario.email === email;
    });

    if (checkEmailCpf) {
        return res.status(400).json({message: 'Já existe uma conta com o cpf ou e-mail informado!'});
    }
    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({message: 'PREENCHA TODOS OS CAMPOS'});
    }

    const register = {
        numero: accountNumber++,
        saldo: 0,
        usuario: {
            nome,
            cpf,
            data_nascimento,
            telefone,
            email,
            senha
        }
    }

   contas.push(register);

    res.status(201).json();
};

const updateAccount = (req, res) => {
    const { numeroConta } = req.params;
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    const checkEmailCpf = contas.find((item) => {
        return item['usuario'].cpf === cpf || item['usuario'].email === email;
    });
    const checkURLNumber = contas.find((item) => {
        return item.numero === Number(numeroConta);
    });
    
    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({message: 'PREENCHA TODOS OS CAMPOS'});
    }
    if (!Number(numeroConta) || !checkURLNumber) {
        return res.status(400).json({message: 'NÚMERO DA CONTA INVÁLIDO'});
    }
    if (checkEmailCpf) {
        return res.status(400).json({message: 'Já existe uma conta com o cpf ou e-mail informado!'});
    }
 
    const user = contas.find((item) => {
       return item.numero === Number(numeroConta); 
    });
    
    user.usuario.nome = nome;
    user.usuario.cpf = cpf;
    user.usuario.data_nascimento = data_nascimento;
    user.usuario.telefone = telefone;
    user.usuario.email = email;
    user.usuario.senha = senha;

    return res.status(201).send();
};

const deleteAccount = (req, res) => {
    const { numeroConta } = req.params;

    const checkURLNumber = contas.find((item) => {
        return item.numero === Number(numeroConta);
    });
    const checkBalance = contas.find((item) => {
        return item.numero > 0
    });

    if (!Number(numeroConta) || !checkURLNumber) {
        return res.status(400).json({message: 'NÚMERO DA CONTA INVÁLIDO'});
    }
    if (!checkBalance) {
        return res.status(403).json({message: 'A conta só pode ser removida se o saldo for zero!'});
    }

    contas = contas.filter((item) => {
        return item.numero !== Number(numeroConta);
    });
    
    return res.status(204).send();
};

const deposit = (req, res) => {
    const { numero_conta, valor } = req.body;
    
    const account = contas.find((item) => {
        return item.numero === Number(numero_conta);
    });

    if (!numero_conta || !valor || valor < 0) {
        return res.status(404).json({message: 'O número da conta e o valor são obrigatórios!'});
    }
    if (!account) {
        return res.status(400).json({message: 'NÚMERO DA CONTA INVÁLIDO'});
    }

    account.saldo += valor;

    const registerDeposit = {
        data: format(new Date, "yyyy-MM-d kk:mm:ss"),
        numero_conta,
        valor
    }

    depositos.push(registerDeposit);
    
    return res.status(204).send();
};

const withdrawMoney = (req, res) => {
    const { numero_conta, valor, senha } = req.body;

    const account = contas.find((item) => {
        return item.numero === Number(numero_conta);
    });

    if (!numero_conta || !valor || !senha) {
        return res.status(404).json({message: 'INFORME TODOS OS CAMPOS'});
    }
    if (!account) {
        return res.status(404).json({message: 'CONTA BANCARIA NÃO EXISTE'});
    }
    
    const accountPassword = account.usuario.senha === senha;
    const checkBalance = contas.find((item) => {
        return item.numero > 0
    });

    if (!accountPassword) {
        return res.status(403).json({message: 'SENHA INVÁLIDA'});
    }
    if (!checkBalance || account.saldo < valor) {
        return res.status(403).json({message: 'NÃO A SALDO DISPONIVEL PARA SAQUE'});
    }

    account.saldo -= valor;

    const register = {
        data: format(new Date, "yyyy-MM-d kk:mm:ss"),
        numero_conta,
        valor
    }

    saques.push(register);
    
    return res.status(204).send();
};

const transfer = (req, res) => {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;

    const accountOrigin = contas.find((item) => {
        return item.numero === Number(numero_conta_origem);
    });
    const accountDestiny = contas.find((item) => {
        return item.numero === Number(numero_conta_destino);
    });
   
    if (!numero_conta_origem || !numero_conta_destino || !valor || !senha) {
        return res.status(404).json({message: 'INFORME TODOS OS CAMPOS'});
    }
    if (!accountOrigin) {
        return res.status(404).json({message: 'CONTA BANCARIA ORIGEM NÃO EXISTE'});
    }
    if (!accountDestiny) {
        return res.status(404).json({message: 'CONTA BANCARIA DESTINO NÃO EXISTE'});
    } 

    const accountPassword = accountOrigin.usuario.senha === senha;
    const checkBalance = accountOrigin.saldo < 0;

    if (!accountPassword) {
        return res.status(403).json({message: 'SENHA INVÁLIDA'});
    }
    if (checkBalance || accountOrigin.saldo < valor) {
        return res.status(403).json({message: 'NÃO A SALDO DISPONIVEL PARA TRANSFERENCIA'});
    }

    accountOrigin.saldo -= valor;
    accountDestiny.saldo += valor;

    const register = {
        data: format(new Date, "yyyy-MM-d kk:mm:ss"),
        numero_conta_origem,
        numero_conta_destino,
        valor
    }

    transferencias.push(register);
   
    return res.status(204).send();
};

const balance = (req, res) => {
    const { numero_conta, senha } = req.query;
    
    const account = contas.find((item) => {
        return item.numero === Number(numero_conta);
    });
    if (!account) {
        return res.status(404).json({message: 'CONTA BANCARIA NÃO EXISTE'});
    }
    const accountPassword = account['usuario'].senha == senha;
    if (!numero_conta || !senha) {
        return res.status(404).json({message: 'INFORME TODOS OS CAMPOS'});
    }
    if (!accountPassword) {
        return res.status(403).json({message: 'SENHA INVÁLIDA'});
    }

    return res.status(200).json({saldo: account.saldo});
}

const extract = (req, res) => {
    const { numero_conta, senha } = req.query;

    const account = contas.find((item) => {
        return item.numero == numero_conta;
    });
    
    if (!numero_conta || !senha) {
        return res.status(404).json({message: 'INFORME TODOS OS CAMPOS'});
    }
    if (!account) {
        return res.status(404).json({message: 'CONTA BANCARIA NÃO EXISTE'});
    }
    if (account.usuario.senha !== senha) {
        return res.status(403).json({message: 'SENHA INVÁLIDA'});
    }
    
    const extractDeposits = depositos.filter((item) => {
        return item.numero_conta == numero_conta;
    });
    const extractWithdraw = saques.filter((item) => {
        return item.numero_conta == numero_conta;
    })
    const transferSent = transferencias.filter((item) => {
        return item.numero_conta_origem == numero_conta;
    });
    const transferReceived = transferencias.filter((item) => {
        return item.numero_conta_destino == numero_conta;
    });
    
    return res.status(201).json({
        depositos: extractDeposits,
        saques: extractWithdraw,
        transferenciasEnviadas: transferSent,
        transferenciasRecebidas: transferReceived
    })
};

module.exports = { listAccounts, createAccount, updateAccount, deleteAccount, deposit, withdrawMoney, transfer, balance, extract };