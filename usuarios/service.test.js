import { jest } from '@jest/globals';

const resultados = {
    listar: [{ id: 1, nome: 'Ana' }],
    criar: 1,
    visualizar: { id: 1, nome: 'Ana' },
    editar: { id: 1, nome: 'Ana Maria' },
    deletar: { id: 1, deletado_em: new Date('2026-01-01') },
    listarInteressesUsuario: [{ id: 2, nome: 'Música' }],
    criarInteresseUsuario: undefined,
    visualizarInteresseUsuario: [{ id: 2, nome: 'Música' }],
    deletarInteresseUsuario: undefined
};

const repository = Object.fromEntries(
    Object.keys(resultados).map((metodo) => [
        metodo,
        jest.fn()
    ])
);

jest.unstable_mockModule('./repository.js', () => repository);
const service = await import('./service.js');

const usuario = {
    nome: 'Ana',
    email: 'ana@email.com',
    senha: 'senha-segura',
    data_nascimento: '2000-01-01'
};

const casos = [
    ['listar', () => service.listar(), []],
    ['criar', () => service.criar(usuario), [usuario]],
    ['visualizar', () => service.visualizar(1), [1]],
    ['editar', () => service.editar(1, { nome: 'Ana Maria' }), [1, { nome: 'Ana Maria' }]],
    ['deletar', () => service.deletar(1), [1]],
    ['listarInteressesUsuario', () => service.listarInteressesUsuario(1), [1]],
    ['criarInteresseUsuario', () => service.criarInteresseUsuario(1, 2), [1, 2]],
    ['visualizarInteresseUsuario', () => service.visualizarInteresseUsuario(1, 2), [1, 2]],
    ['deletarInteresseUsuario', () => service.deletarInteresseUsuario(1, 2), [1, 2]]
];

for (const [metodo, executar, argumentos] of casos) {
    test(`delega ${metodo} ao repositório e retorna seu resultado`, async () => {
        repository[metodo].mockResolvedValue(resultados[metodo]);

        const resultado = await executar();

        expect(resultado).toBe(resultados[metodo]);
        expect(repository[metodo]).toHaveBeenCalledTimes(1);
        expect(repository[metodo]).toHaveBeenCalledWith(...argumentos);

        jest.clearAllMocks();
    });
}
