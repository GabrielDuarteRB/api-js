import express from 'express';
import { once } from 'node:events';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'app-js-database-test';
process.env.DB_HOST = process.env.TEST_DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.TEST_DB_PORT || '5434';
process.env.DB_DIALECT = 'postgres';

if (!process.env.DB_NAME.endsWith('-test')) {
    throw new Error('Os testes de integração só podem ser executados em um banco com sufixo -test.');
}

const { default: db } = await import('../database.js');
const { default: router } = await import('../router.js');

const app = express();
app.use(express.json());
app.use('/', router);

let servidor;
let urlBase;

beforeAll(async () => {
    await db.authenticate();
    await db.sync({ force: true });

    servidor = app.listen(0, '127.0.0.1');
    await once(servidor, 'listening');

    const { port } = servidor.address();
    urlBase = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
    if (servidor?.listening) {
        await new Promise((resolve, reject) => {
            servidor.close((erro) => (erro ? reject(erro) : resolve()));
        });
    }

    await db.close();
});

beforeEach(async () => {
    await db.truncate({ cascade: true, restartIdentity: true });
});

async function requisicao(metodo, caminho, corpo) {
    const resposta = await fetch(`${urlBase}${caminho}`, {
        method: metodo,
        headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
        body: corpo ? JSON.stringify(corpo) : undefined
    });
    const conteudo = resposta.headers.get('content-type')?.includes('application/json')
        ? await resposta.json()
        : await resposta.text();

    return { resposta, conteudo };
}

async function criarUsuario() {
    const usuario = {
        nome: 'Ana',
        email: 'ana@email.com',
        senha: 'senha-segura',
        data_nascimento: '2000-01-01'
    };
    const { resposta, conteudo: id } = await requisicao('POST', '/usuarios', usuario);

    expect(resposta.status).toBe(201);
    return { id, usuario };
}

test('cria e lista usuários pelo endpoint', async () => {
    const { id, usuario } = await criarUsuario();
    const { resposta, conteudo } = await requisicao('GET', '/usuarios');

    expect(resposta.status).toBe(200);
    expect(conteudo).toEqual([
        expect.objectContaining({ id, nome: usuario.nome, email: usuario.email })
    ]);
});

test('consulta um usuário pelo id', async () => {
    const { id, usuario } = await criarUsuario();
    const { resposta, conteudo } = await requisicao('GET', `/usuarios/${id}`);

    expect(resposta.status).toBe(200);
    expect(conteudo).toEqual(expect.objectContaining({
        id,
        nome: usuario.nome,
        email: usuario.email,
        data_nascimento: usuario.data_nascimento
    }));
});
