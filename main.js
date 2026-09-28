// importa o express pra criar o servidor
const express = require("express");

// importa o path pra trabalhar com caminhos de arquivos
const path = require("path");

// importa o banco e autenticacao do firebase
const {
    banco,
    autenticacao
} = require("./firebase.js");

// importa o timestamp do firebase
const {
    Timestamp
} = require("firebase-admin/firestore");

// chave usada pra acessar a api do firebase autenticatio
const chaveApiFirebase =
    "AIzaSyBePTAawgoODCrupD5pbi7CYAhl0U991QE";

// cria a aplicacao express
const app = express();

// define a porta do servidor
const PORTA = 3000;

// permite q o back receba dados em formato json
app.use(express.json());

// mostra os arquivos da pasta html
app.use(express.static("html"));

// disponibiliza os arquivos css
app.use("/style", express.static("style"));

// disponibiliza os arquivos javascript
app.use("/js", express.static("js"));

// disponibiliza as imagens
app.use(
    "/imagens",
    express.static(
        path.join(__dirname, "imagens")
    )
);

// pagina inicial
app.get("/", function (req, res) {

    res.sendFile(
        __dirname + "/html/index.html"
    );

});


// cadastro da nutricionista
app.post(
    "/api/nutricionista/cadastro",
    async function (req, res) {

        const {
            nome,
            cpf,
            telefone,
            crn,
            email,
            senha
        } = req.body;

        try {

            // verifica se todos os campos foram preenchidos
            if (
                !nome ||
                !cpf ||
                !telefone ||
                !crn ||
                !email ||
                !senha
            ) {

                return res.status(400).json({
                    mensagem:
                        "Preencha todos os campos obrigatórios."
                });

            }

            // remove caracteres q n sao numeros do cpf
            const cpfNumeros =
                cpf.replace(/\D/g, "");

            // verifica se o cpf possui 11 numeros
            if (cpfNumeros.length !== 11) {

                return res.status(400).json({
                    mensagem:
                        "CPF inválido."
                });

            }

            // verifica o limite de caracteres do nome
            if (nome.length > 100) {

                return res.status(400).json({
                    mensagem:
                        "O nome deve ter no máximo 100 caracteres."
                });

            }

            // verifica o limite de caracteres do crn
            if (crn.length > 30) {

                return res.status(400).json({
                    mensagem:
                        "O CRN deve ter no máximo 30 caracteres."
                });

            }

            // verifica o limite de caracteres do email
            if (email.length > 255) {

                return res.status(400).json({
                    mensagem:
                        "O e-mail deve ter no máximo 255 caracteres."
                });

            }

            // verifica o limite de caracteres do telefone
            if (telefone.length > 15) {

                return res.status(400).json({
                    mensagem:
                        "O telefone deve ter no máximo 15 caracteres."
                });

            }

            // verifica o tamanho minimo da senha
            if (senha.length < 6) {

                return res.status(400).json({
                    mensagem:
                        "A senha deve ter no mínimo 6 caracteres."
                });

            }

            // cria a conta da nutricionista no firebase autwntication
            const usuario =
                await autenticacao.createUser({
                    email: email,
                    password: senha
                });

            // salva os dados da nutricionista no firestore
            await banco
                .collection("nutricionistas")
                .doc(usuario.uid)
                .set({

                    nome:
                        nome,

                    cpf:
                        cpf,

                    telefone:
                        telefone,

                    crn:
                        crn,

                    email:
                        email

                });

            // mostra no terminal q o cadastro foi realizado
            console.log(
                "Nutricionista cadastrada!"
            );

            // mostra o uid criado pelo firebase
            console.log(
                "UID:",
                usuario.uid
            );

            // envia a resposta de cadastro realizado
            res.status(201).json({

                mensagem:
                    "Nutricionista cadastrada com sucesso!",

                uid:
                    usuario.uid

            });

        } catch (erro) {

            // mostra o erro do cadastro no terminal
            console.error(
                "Erro ao cadastrar nutricionista:",
                erro
            );

            // envia uma mensagem de erro pra front
            res.status(400).json({

                mensagem:
                    "Não foi possível realizar o cadastro."

            });

        }

    }
);


// login da nutricionista
app.post(
    "/api/nutricionista/login",
    async function (req, res) {

        const {
            email,
            senha
        } = req.body;

        try {

            // verifica se email e senha foram informados
            if (
                !email ||
                !senha
            ) {

                return res.status(400).json({

                    mensagem:
                        "Informe o e-mail e a senha."

                });

            }

            // verifica o email e a senha no firebase atentication
            const resposta =
                await fetch(
                    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" +
                    chaveApiFirebase,
                    {

                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                email:
                                    email,

                                password:
                                    senha,

                                returnSecureToken:
                                    true

                            })

                    }
                );

            // transforma a resposta do firebase em json
            const resultado =
                await resposta.json();

            // verifica se o firebase retornou erro
            if (
                !resposta.ok
            ) {

                // mostra o erro do firebase no terminal
                console.error(
                    "Erro do Firebase no login:",
                    resultado
                );

                // informa q os dados de login estao incorretos
                return res.status(401).json({

                    mensagem:
                        "E-mail ou senha inválidos."

                });

            }

            // mostra o uid do usuario q entrou
            console.log(
                "Login realizado:",
                resultado.localId
            );

            // envia os dados do login pra o front
            res.json({

                mensagem:
                    "Login realizado com sucesso.",

                uid:
                    resultado.localId

            });

        } catch (erro) {

            // mostra o erro do login no terminal
            console.error(
                "Erro ao fazer login:",
                erro
            );

            // informa q n foi possivel realizar o login
            res.status(500).json({

                mensagem:
                    "Não foi possível realizar o login."

            });

        }

    }
);

// transforma uma data recebida pelo formulario em timestamp
function transformarDataTimestamp(data) {

    // retorna vazio se n recebeu uma data
    if (!data) {
        return null;
    }

    // separa ano mes e dia
    const partes =
        data.split("-");

    // verifica se a data possui tres partes
    if (partes.length !== 3) {
        return null;
    }

    // pega o ano da data
    const ano =
        Number(partes[0]);

    // pega o mes e ajusta pro formato do javascript
    const mes =
        Number(partes[1]) - 1;

    // pega o dia da data
    const dia =
        Number(partes[2]);

    // verifica se os valores da data sao validos
    if (
        !ano ||
        mes < 0 ||
        mes > 11 ||
        !dia
    ) {
        return null;
    }

    // cria a data usando utc
    const dataObjeto =
        new Date(
            Date.UTC(
                ano,
                mes,
                dia,
                12,
                0,
                0
            )
        );

    // transforma a data em timestamp do firebase
    return Timestamp.fromDate(
        dataObjeto
    );

}

// normaliza datas vindas do firestore
function normalizarData(data) {

    // retorna vazio quando n existe data
    if (!data) {
        return null;
    }

    // transforma timestamp em texto
    if (typeof data.toDate === "function") {
        return data.toDate().toISOString();
    }

    // transforma date em texto
    if (data instanceof Date) {
        return data.toISOString();
    }

    // retorna o valor original caso n seja timestamp ou date
    return data;
}

// carrega os dados do dashboard
app.get(
    "/api/nutricionista/dashboard",
    async function (req, res) {

        try {

            // pega o uid da nutricionista enviado
            const uidNutricionista =
                req.query.uid;

            // verifica se o uid foi informado
            if (!uidNutricionista) {

                return res.status(400).json({
                    mensagem:
                        "Nutricionista não identificada."
                });

            }

            // busca a nutricionista no firestore
            const documentoNutricionista =
                await banco
                    .collection("nutricionistas")
                    .doc(uidNutricionista)
                    .get();

            // verifica se a nutricionista existe
            if (
                !documentoNutricionista.exists
            ) {

                return res.status(404).json({
                    mensagem:
                        "Nutricionista não encontrada."
                });

            }

            // monta os dados da nutricionista
            const nutricionista = {
                id:
                    documentoNutricionista.id,

                ...documentoNutricionista.data()
            };


            // busca os pacientes da nutricionista
            const pacientesSnapshot =
                await banco
                    .collection("pacientes")
                    .get();

            // transforma os pacientes em uma lista
            const pacientes =
                pacientesSnapshot.docs
                    .map(
                        function (documento) {

                            const dados =
                                documento.data();

                            return {
                                id:
                                    documento.id,

                                ...dados,

                                nascimento:
                                    normalizarData(
                                        dados.nascimento
                                    )
                            };

                        }
                    )
                    .filter(
                        function (paciente) {

                            // mantem somente os pacientes da nutricionista atual
                            return (
                                paciente.id_nutricionista ===
                                uidNutricionista
                            );

                        }
                    );


            // cria uma lista rapida dos pacientes
            const pacientesPorId =
                new Map();

            pacientes.forEach(
                function (paciente) {

                    pacientesPorId.set(
                        paciente.id,
                        paciente
                    );

                }
            );


            // busca as consultas
            const consultasSnapshot =
                await banco
                    .collection("consultas")
                    .get();

            // transforma as consultas em uma lista
            const consultas =
                consultasSnapshot.docs
                    .map(
                        function (documento) {

                            const dados =
                                documento.data();

                            const paciente =
                                pacientesPorId.get(
                                    dados.id_paciente
                                );

                            return {
                                id:
                                    documento.id,

                                ...dados,

                                pacienteNome:
                                    paciente
                                    ? paciente.nome
                                    : "Paciente não informado"
                            };

                        }
                    )
                    .filter(
                        function (consulta) {

                            // mantem somente as consultas da nutricionista atual
                            return (
                                consulta.id_nutricionista ===
                                uidNutricionista
                            );

                        }
                    );


            // busca as dietas
            const dietasSnapshot =
                await banco
                    .collection("dietas")
                    .get();

            // transforma as dietas em uma lista
            const dietas =
                dietasSnapshot.docs
                    .map(
                        function (documento) {

                            const dados =
                                documento.data();

                            const paciente =
                                pacientesPorId.get(
                                    dados.id_paciente
                                );

                            return {
                                id:
                                    documento.id,

                                ...dados,

                                data_inicio:
                                    normalizarData(
                                        dados.data_inicio
                                    ),

                                data_fim:
                                    normalizarData(
                                        dados.data_fim
                                    ),

                                pacienteNome:
                                    paciente
                                    ? paciente.nome
                                    : "Paciente não informado"
                            };

                        }
                    )
                    .filter(
                        function (dieta) {

                            // manteem somente dietas ligadas aos pacientes encontrados
                            return (
                                dieta.id_paciente &&
                                pacientesPorId.has(
                                    dieta.id_paciente
                                )
                            );

                        }
                    );


            // busca os fedbacks
            const feedbacksSnapshot =
                await banco
                    .collection("feedbacks")
                    .where(
                        "id_nutricionista",
                        "==",
                        uidNutricionista
                    )
                    .get();

            // transforma os feedbacks em uma lista
            const feedbacks =
                feedbacksSnapshot.docs.map(
                    function (documento) {

                        const dados =
                            documento.data();

                        return {
                            id:
                                documento.id,

                            ...dados,

                            data:
                                normalizarData(
                                    dados.data
                                )
                        };

                    }
                );


            // busca os relatorios
            const relatoriosSnapshot =
                await banco
                    .collection("relatorio")
                    .get();

            // transforma os relatorios em uma lista
            const relatorios =
                relatoriosSnapshot.docs
                    .map(
                        function (documento) {

                            const dados =
                                documento.data();

                            return {
                                id:
                                    documento.id,

                                ...dados,

                                data:
                                    normalizarData(
                                        dados.data
                                    )
                            };

                        }
                    )
                    .filter(
                        function (relatorio) {

                            // mostra relatorio da nutricionista atual
                            if (
                                relatorio.id_nutricionista
                            ) {

                                return (
                                    relatorio.id_nutricionista ===
                                    uidNutricionista
                                );

                            }

                            // mantem relatorios antigos
                            // ligados a pacientes da nutricionista
                            if (
                                relatorio.id_paciente
                            ) {

                                return pacientesPorId.has(
                                    relatorio.id_paciente
                                );

                            }

                            // ignora relatorios sem vinculacao
                            return false;

                        }
                    );


            // envia todos os dados pro dashboard
            res.json({

                nutricionista:
                    nutricionista,

                pacientes:
                    pacientes,

                consultas:
                    consultas,

                dietas:
                    dietas,

                feedbacks:
                    feedbacks,

                relatorios:
                    relatorios

            });

        } catch (erro) {

            // mostra o erro ao carregar o dashboard
            console.error(
                "Erro ao carregar dashboard:",
                erro
            );

            // envia uma resposta de erro pra o front
            return res.status(500).json({

                mensagem:
                    "Erro ao carregar o dashboard."

            });

        }

    }
);


// atualiza os dados da nutricionista
app.put(
    "/api/nutricionista/:id",
    async function (req, res) {

        const id =
            req.params.id;

        const {
            nome,
            cpf,
            crn,
            email,
            telefone
        } = req.body;

        try {

            // verifica se todos os campos foram preenchidos
            if (
                !nome ||
                !cpf ||
                !crn ||
                !email ||
                !telefone
            ) {

                return res.status(400).json({

                    mensagem:
                        "Preencha todos os campos obrigatórios."

                });

            }

            // remove caracteres q n sao numeros do cpf
            const cpfNumeros =
                cpf.replace(/\D/g, "");

            // verifica se o cpf possui 11 numeros
            if (
                cpfNumeros.length !== 11
            ) {

                return res.status(400).json({

                    mensagem:
                        "CPF inválido."

                });

            }

            // verifica o limite de caracteres do nome
            if (
                nome.length > 100
            ) {

                return res.status(400).json({

                    mensagem:
                        "O nome deve ter no máximo 100 caracteres."

                });

            }

            // verifica o limite de caracteres do crn
            if (
                crn.length > 30
            ) {

                return res.status(400).json({

                    mensagem:
                        "O CRN deve ter no máximo 30 caracteres."

                });

            }

            // verifica o limite de caracteres do email
            if (
                email.length > 255
            ) {

                return res.status(400).json({

                    mensagem:
                        "O e-mail deve ter no máximo 255 caracteres."

                });

            }

            // verifica o limite de caracteres do telefone
            if (
                telefone.length > 15
            ) {

                return res.status(400).json({

                    mensagem:
                        "O telefone deve ter no máximo 15 caracteres."

                });

            }

            // busca a nutricionista no firestore
            const nutricionistaDocumento =
                await banco
                    .collection("nutricionistas")
                    .doc(id)
                    .get();

            // verifica se a nutricionista existe
            if (
                !nutricionistaDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Nutricionista não encontrada."

                });

            }


            // atualiza os dados no firestore
            await banco
                .collection("nutricionistas")
                .doc(id)
                .update({

                    nome:
                        nome,

                    cpf:
                        cpf,

                    crn:
                        crn,

                    email:
                        email,

                    telefone:
                        telefone

                });

            // mostra no terminal q os dados foram atualizados
            console.log(
                "Nutricionista atualizada:",
                id
            );

            // envia a resposta de sucesso
            res.json({

                mensagem:
                    "Dados atualizados com sucesso."

            });

        } catch (erro) {

            // mostra o erro no terminal
            console.error(
                "Erro ao atualizar nutricionista:",
                erro
            );

            // envia a resposta de erro
            res.status(500).json({

                mensagem:
                    "Não foi possível atualizar os dados da nutricionista."

            });

        }

    }
);


// atualiza os dados do paciente
app.put(
    "/api/paciente/:id",
    async function (req, res) {

        const id =
            req.params.id;

        const {
            nome,
            nascimento,
            classificacao
        } = req.body;

        try {

            // verifica se nome e nascimento foram informados
            if (
                !nome ||
                !nascimento
            ) {

                return res.status(400).json({

                    mensagem:
                        "Nome e data de nascimento são obrigatórios."

                });

            }

            // verifica se a data esta no formato desejado
            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    nascimento
                )
            ) {

                return res.status(400).json({

                    mensagem:
                        "Data de nascimento inválida."

                });

            }

            // busca o paciente no firestore
            const pacienteDocumento =
                await banco
                    .collection("pacientes")
                    .doc(id)
                    .get();

            // verifica se o paciente existe
            if (
                !pacienteDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Paciente não encontrado."

                });

            }

            // atualiza os dados do paciente no firestore
            await banco
                .collection("pacientes")
                .doc(id)
                .update({

                    nome:
                        nome,

                    nascimento:
                        nascimento,

                    classificacao:
                        classificacao ||
                        "nao_classificado"

                });

            // mostra no terminal q os dados foram atualizados
            console.log(
                "Paciente atualizado:",
                id
            );

            // envia a resposta de sucesso
            res.json({

                mensagem:
                    "Paciente atualizado com sucesso."

            });

        } catch (erro) {

            // mostra o erro no terminal
            console.error(
                "Erro ao atualizar paciente:",
                erro
            );

            // envia a resposta de erro
            res.status(500).json({

                mensagem:
                    "Não foi possível atualizar o paciente."

            });

        }

    }
);


// cria uma nova consulta
app.post(
    "/api/consultas",
    async function (req, res) {

        const {
            id_paciente,
            dataehoras,
            id_nutricionista
        } = req.body;

        try {

            // pega a nutricionista enviada na requisicao
            const uidNutricionista =
                id_nutricionista ||
                req.query.uid;

            // verifica se os dados obrigatorios foram enviados
            if (
                !id_paciente ||
                !dataehoras ||
                !uidNutricionista
            ) {

                return res.status(400).json({

                    mensagem:
                        "Paciente, data, horário e nutricionista são obrigatórios."

                });

            }


            // verifica se a data e o horario sao validos
            const dataConsulta =
                new Date(dataehoras);

            if (
                Number.isNaN(
                    dataConsulta.getTime()
                )
            ) {

                return res.status(400).json({

                    mensagem:
                        "Data ou horário da consulta inválido."

                });

            }


            // verifica se o paciente existe
            const pacienteDocumento =
                await banco
                    .collection("pacientes")
                    .doc(id_paciente)
                    .get();


            if (
                !pacienteDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Paciente não encontrado."

                });

            }


            // pega os dados do paciente
            const paciente =
                pacienteDocumento.data();


            // vincula o paciente a nutricionista
            // caso ainda n tenha nutricionista
            if (
                !paciente.id_nutricionista
            ) {

                await banco
                    .collection("pacientes")
                    .doc(id_paciente)
                    .update({

                        id_nutricionista:
                            uidNutricionista

                    });

            } else if (
                paciente.id_nutricionista !==
                uidNutricionista
            ) {

                return res.status(403).json({

                    mensagem:
                        "Este paciente pertence a outra nutricionista."

                });

            }


            // cria a consulta
            const novaConsulta =
                await banco
                    .collection("consultas")
                    .add({

                        id_paciente:
                            id_paciente,

                        id_nutricionista:
                            uidNutricionista,

                        dataehoras:
                            dataehoras || ""

                    });


            // mostra no terminal q a consulta foi criada
            console.log(
                "Consulta criada:",
                novaConsulta.id
            );


            // envia a resposta de consulta criada
            res.status(201).json({

                mensagem:
                    "Consulta agendada com sucesso.",

                id:
                    novaConsulta.id

            });

        } catch (erro) {

            // mostra o erro no terminal
            console.error(
                "Erro ao criar consulta:",
                erro
            );

            // envia a resposta de erro
            res.status(500).json({

                mensagem:
                    "Não foi possível agendar a consulta."

            });

        }

    }
);


// apaga uma consulta
app.delete(
    "/api/consultas/:id",
    async function (req, res) {

        const id =
            req.params.id;

        const uidNutricionista =
            req.query.uid;

        try {

            // verifica se o id da consulta foi informado
            if (!id) {

                return res.status(400).json({

                    mensagem:
                        "Consulta não identificada."

                });

            }

            // busca a consulta no firestore
            const consultaDocumento =
                await banco
                    .collection("consultas")
                    .doc(id)
                    .get();

            // verifica se a consulta existe
            if (
                !consultaDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Consulta não encontrada."

                });

            }

            // pega os dados da consulta
            const consulta =
                consultaDocumento.data();


            // impede apagar consulta de outra nutricionista
            if (
                uidNutricionista &&
                consulta.id_nutricionista &&
                consulta.id_nutricionista !==
                    uidNutricionista
            ) {

                return res.status(403).json({

                    mensagem:
                        "Você não pode apagar esta consulta."

                });

            }

            // apaga a consulta do firestore
            await banco
                .collection("consultas")
                .doc(id)
                .delete();

            // mostra no terminal q a consulta foi apagada
            console.log(
                "Consulta apagada:",
                id
            );

            // envia a resposta de sucesso
            res.json({

                mensagem:
                    "Consulta apagada com sucesso."

            });

        } catch (erro) {

            // mostra o erro no terminal
            console.error(
                "Erro ao apagar consulta:",
                erro
            );

            // envia a resposta de erro
            res.status(500).json({

                mensagem:
                    "Não foi possível apagar a consulta."

            });

        }

    }
);


// cria uma nova dieta
app.post(
    "/api/dietas",
    async function (req, res) {

        const {
            id_paciente,
            titulo,
            descricao,
            data_inicio,
            data_fim
        } = req.body;

        try {

            // verifica se os dados obrigatorios foram enviados
            if (
                !id_paciente ||
                !titulo ||
                !data_inicio ||
                !data_fim
            ) {

                return res.status(400).json({

                    mensagem:
                        "Paciente, título, data de início e data de fim são obrigatórios."

                });

            }


            // verifica se as datas sao validas
            const inicio =
                transformarDataTimestamp(
                    data_inicio
                );

            const fim =
                transformarDataTimestamp(
                    data_fim
                );

            if (
                !inicio ||
                !fim
            ) {

                return res.status(400).json({

                    mensagem:
                        "As datas da dieta são inválidas."

                });

            }


            // verifica se a data final n vem antes da inicial
            if (
                fim.toDate() <
                inicio.toDate()
            ) {

                return res.status(400).json({

                    mensagem:
                        "A data de fim não pode ser anterior à data de início."

                });

            }


            // verifica se o paciente existe
            const pacienteDocumento =
                await banco
                    .collection("pacientes")
                    .doc(id_paciente)
                    .get();

            if (
                !pacienteDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Paciente não encontrado."

                });

            }

            // pega os dados do paciente
            const paciente =
                pacienteDocumento.data();


            // a dieta so pode ser criada pra paciente ja vinculado a uma nutricionista
            if (
                !paciente.id_nutricionista
            ) {

                return res.status(400).json({

                    mensagem:
                        "Este paciente ainda não está vinculado a uma nutricionista."

                });

            }


            // cria o documento antes pra usar o mesmo id em id_dieta
            const dietaDocumento =
                banco
                    .collection("dietas")
                    .doc();

            // guarda o id criado pra usar no documento
            const idDieta =
                dietaDocumento.id;

            // salva a nova dieta no firestore
            await dietaDocumento.set({

                data_fim:
                    fim,

                data_inicio:
                    inicio,

                descricao:
                    descricao || "",

                id_dieta:
                    idDieta,

                id_paciente:
                    id_paciente,

                titulo:
                    titulo

            });

            // mostra no terminal q a dieta foi criada
            console.log(
                "Dieta criada:",
                idDieta
            );

            // envia a resposta de dieta criada
            res.status(201).json({

                mensagem:
                    "Dieta criada com sucesso.",

                id:
                    idDieta

            });

        } catch (erro) {

            // mostra o erro no terminal
            console.error(
                "Erro ao criar dieta:",
                erro
            );

            // envia a resposta de erro
            res.status(500).json({

                mensagem:
                    "Não foi possível salvar a dieta."

            });

        }

    }
);


// edita uma dieta
app.put(
    "/api/dietas/:id",
    async function (req, res) {

        const id =
            req.params.id;

        const {
            id_paciente,
            titulo,
            descricao,
            data_inicio,
            data_fim
        } = req.body;

        const uidNutricionista =
            req.query.uid ||
            req.body.id_nutricionista;

        try {

            // verifica se os dados obrigatorios foram enviados
            if (
                !id_paciente ||
                !titulo ||
                !data_inicio ||
                !data_fim
            ) {

                return res.status(400).json({

                    mensagem:
                        "Paciente, título, data de início e data de fim são obrigatórios."

                });

            }


            // verifica se as datas sao validas
            const inicio =
                transformarDataTimestamp(
                    data_inicio
                );

            const fim =
                transformarDataTimestamp(
                    data_fim
                );

            if (
                !inicio ||
                !fim
            ) {

                return res.status(400).json({

                    mensagem:
                        "As datas da dieta são inválidas."

                });

            }


            // verifica se a data final n vem antes da inicial
            if (
                fim.toDate() <
                inicio.toDate()
            ) {

                return res.status(400).json({

                    mensagem:
                        "A data de fim não pode ser anterior à data de início."

                });

            }


            // busca a dieta
            const dietaDocumento =
                await banco
                    .collection("dietas")
                    .doc(id)
                    .get();

            if (
                !dietaDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Dieta não encontrada."

                });

            }


            // verifica se o paciente existe
            const pacienteDocumento =
                await banco
                    .collection("pacientes")
                    .doc(id_paciente)
                    .get();

            if (
                !pacienteDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Paciente não encontrado."

                });

            }

            // pega os dados do paciente
            const paciente =
                pacienteDocumento.data();


            // impede editar dieta de paciente de outra nutricionista
            if (
                uidNutricionista &&
                paciente.id_nutricionista !==
                    uidNutricionista
            ) {

                return res.status(403).json({

                    mensagem:
                        "Você não pode editar a dieta deste paciente."

                });

            }

            // atualiza a dieta no firestore
            await banco
                .collection("dietas")
                .doc(id)
                .update({

                    id_paciente:
                        id_paciente,

                    titulo:
                        titulo,

                    descricao:
                        descricao || "",

                    data_inicio:
                        inicio,

                    data_fim:
                        fim

                });

            // mostra no terminal q a dieta foi atualizada
            console.log(
                "Dieta atualizada:",
                id
            );

            // envia a resposta de sucesso
            res.json({

                mensagem:
                    "Dieta atualizada com sucesso."

            });

        } catch (erro) {

            // mostra o erro no terminal
            console.error(
                "Erro ao editar dieta:",
                erro
            );

            res.status(500).json({

                mensagem:
                    "Não foi possível atualizar a dieta."

            });

        }

    }
);


// exclui uma dieta
app.delete(
    "/api/dietas/:id",
    async function (req, res) {

        const id =
            req.params.id;

        const uidNutricionista =
            req.query.uid;

        try {

            // verifica se o id da dieta foi informado
            if (!id) {

                return res.status(400).json({

                    mensagem:
                        "Dieta não identificada."

                });

            }


            // busca a dieta
            const dietaDocumento =
                await banco
                    .collection("dietas")
                    .doc(id)
                    .get();

            if (
                !dietaDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Dieta não encontrada."

                });

            }

            // pega os dados da dieta
            const dieta =
                dietaDocumento.data();


            // verifica se o paciente existe
            const pacienteDocumento =
                await banco
                    .collection("pacientes")
                    .doc(dieta.id_paciente)
                    .get();

            if (
                !pacienteDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Paciente da dieta não encontrado."

                });

            }

            // pega os dados do paciente
            const paciente =
                pacienteDocumento.data();


            // impede apagar dieta de outra nutricionista
            if (
                uidNutricionista &&
                paciente.id_nutricionista !==
                    uidNutricionista
            ) {

                return res.status(403).json({

                    mensagem:
                        "Você não pode excluir esta dieta."

                });

            }

            // apaga a dieta do firestore
            await banco
                .collection("dietas")
                .doc(id)
                .delete();

            // mostra no terminal q a dieta foi apagada
            console.log(
                "Dieta excluída:",
                id
            );

            // envia a resposta de sucesso
            res.json({

                mensagem:
                    "Dieta excluída com sucesso."

            });

        } catch (erro) {

            // mostra o erro no terminal
            console.error(
                "Erro ao excluir dieta:",
                erro
            );

            res.status(500).json({

                mensagem:
                    "Não foi possível excluir a dieta."

            });

        }

    }
);


// cria um novo relatorio
app.post(
    "/api/relatorios",
    async function (req, res) {

        const {
            titulo,
            id_paciente,
            descricao
        } = req.body;

        try {

            // verifica se os dados obrigatorios foram enviados
            if (
                !titulo ||
                !id_paciente ||
                !descricao
            ) {

                return res.status(400).json({

                    mensagem:
                        "Título, paciente e descrição são obrigatórios."

                });

            }


            // verifica se o paciente existe
            const pacienteDocumento =
                await banco
                    .collection("pacientes")
                    .doc(id_paciente)
                    .get();

            if (
                !pacienteDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Paciente não encontrado."

                });

            }

            // pega os dados do paciente
            const paciente =
                pacienteDocumento.data();


            // pega automaticamente a nutricionista do paciente
            const id_nutricionista =
                paciente.id_nutricionista;

            // verifica se o paciente esta vinculado a uma nutricionista
            if (
                !id_nutricionista
            ) {

                return res.status(400).json({

                    mensagem:
                        "Este paciente não está vinculado a uma nutricionista."

                });

            }

            // cria o relatorio no firestore
            const novoRelatorio =
                await banco
                    .collection("relatorio")
                    .add({

                        titulo:
                            titulo,

                        id_paciente:
                            id_paciente,

                        id_nutricionista:
                            id_nutricionista,

                        descricao:
                            descricao,

                        data:
                            Timestamp.now()

                    });

            // mostra no terminal q o relatorio foi criado
            console.log(
                "Relatório criado:",
                novoRelatorio.id
            );

            // envia a resposta de relatorio criado
            res.status(201).json({

                mensagem:
                    "Relatório salvo com sucesso.",

                id:
                    novoRelatorio.id

            });

        } catch (erro) {

            // mostra o erro no terminal
            console.error(
                "Erro ao criar relatório:",
                erro
            );

            res.status(500).json({

                mensagem:
                    "Não foi possível salvar o relatório."

            });

        }

    }
);


// edita um relatorio
app.put(
    "/api/relatorios/:id",
    async function (req, res) {

        const id =
            req.params.id;

        const {
            titulo,
            id_paciente,
            descricao
        } = req.body;

        const uidNutricionista =
            req.query.uid ||
            req.body.id_nutricionista;

        try {

            // verifica se os dados obrigatorios foram enviados
            if (
                !titulo ||
                !id_paciente ||
                !descricao
            ) {

                return res.status(400).json({

                    mensagem:
                        "Título, paciente e descrição são obrigatórios."

                });

            }


            // busca o relatorio
            const relatorioDocumento =
                await banco
                    .collection("relatorio")
                    .doc(id)
                    .get();

            if (
                !relatorioDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Relatório não encontrado."

                });

            }


            // verifica se o paciente existe
            const pacienteDocumento =
                await banco
                    .collection("pacientes")
                    .doc(id_paciente)
                    .get();

            if (
                !pacienteDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Paciente não encontrado."

                });

            }

            // pega os dados do paciente
            const paciente =
                pacienteDocumento.data();


            // impede editar relatorio de paciente de outra nutricionista
            if (
                uidNutricionista &&
                paciente.id_nutricionista !==
                    uidNutricionista
            ) {

                return res.status(403).json({

                    mensagem:
                        "Você não pode editar o relatório deste paciente."

                });

            }

            // atualiza o relatorio no firestore
            await banco
                .collection("relatorio")
                .doc(id)
                .update({

                    titulo:
                        titulo,

                    id_paciente:
                        id_paciente,

                    descricao:
                        descricao

                });

            // mostra no terminal q o relatorio foi atualizado
            console.log(
                "Relatório atualizado:",
                id
            );

            // envia a resposta de sucesso
            res.json({

                mensagem:
                    "Relatório atualizado com sucesso."

            });

        } catch (erro) {

            // mostra o erro no terminal
            console.error(
                "Erro ao editar relatório:",
                erro
            );

            res.status(500).json({

                mensagem:
                    "Não foi possível atualizar o relatório."

            });

        }

    }
);


// exclui um relatorio
app.delete(
    "/api/relatorios/:id",
    async function (req, res) {

        const id =
            req.params.id;

        const uidNutricionista =
            req.query.uid;

        try {

            // verifica se o id do relatorio foi informado
            if (!id) {

                return res.status(400).json({

                    mensagem:
                        "Relatório não identificado."

                });

            }


            // busca o relatorio
            const relatorioDocumento =
                await banco
                    .collection("relatorio")
                    .doc(id)
                    .get();

            if (
                !relatorioDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Relatório não encontrado."

                });

            }

            // pega os dados do relatorio
            const relatorio =
                relatorioDocumento.data();


            // verifica se o paciente existe
            const pacienteDocumento =
                await banco
                    .collection("pacientes")
                    .doc(relatorio.id_paciente)
                    .get();

            if (
                !pacienteDocumento.exists
            ) {

                return res.status(404).json({

                    mensagem:
                        "Paciente do relatório não encontrado."

                });

            }

            // pega os dados do paciente
            const paciente =
                pacienteDocumento.data();


            // impede apagar relatorio de outra nutricionista
            if (
                uidNutricionista &&
                paciente.id_nutricionista !==
                    uidNutricionista
            ) {

                return res.status(403).json({

                    mensagem:
                        "Você não pode excluir este relatório."

                });

            }

            // apaga o relatorio do firestore
            await banco
                .collection("relatorio")
                .doc(id)
                .delete();

            // mostra no terminal q o relatorio foi apagado
            console.log(
                "Relatório excluído:",
                id
            );

            // envia a resposta de sucesso
            res.json({

                mensagem:
                    "Relatório excluído com sucesso."

            });

        } catch (erro) {

            // mostra o erro ao excluir o relatório
            console.error(
                "Erro ao excluir relatório:",
                erro
            );

            res.status(500).json({

                mensagem:
                    "Não foi possível excluir o relatório."

            });

        }

    }
);


// inicia o servidor
app.listen(
    PORTA,
    function () {

        // mostra no terminal q o servidor foi iniciado
        console.log(
            "Servidor iniciado"
        );

        // mostra o endereco pra acessar o sistema
        console.log(
            "Acesse: http://localhost:3000"
        );

        // confirma a conexao com o firebase
        console.log(
            "Firebase conectado"
        );

    }
);