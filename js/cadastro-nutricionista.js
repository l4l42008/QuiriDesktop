// pega o formulario de cadastro da nutri
const formulario = document.getElementById("formCadastroNutricionista");

// pega o local onde as mensagens serao mostradas
const mensagem = document.getElementById("mensagem");

// identifica qnd o formulario for enviado
formulario.addEventListener("submit", async function (evento) {
    // impede que a pagina seja recarregada
    evento.preventDefault();

    // pega os dados digitados no formulrio
    const nome = document.getElementById("nome").value;
    const cpf = document.getElementById("cpf").value;
    const telefone = document.getElementById("telefone").value;
    const crn = document.getElementById("crn").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    // organiza os dados do cadastro
    const dados = {
        nome: nome,
        cpf: cpf,
        telefone: telefone,
        crn: crn,
        email: email,
        senha: senha
    };

    try {
        // envia os dados para o back
        const resposta = await fetch("/api/nutricionista/cadastro", {
            method: "POST",

            // informa que estamos enviando json
            headers: {
                "Content-Type": "application/json"
            },

            // transforma os dados em json
            body: JSON.stringify(dados)
        });

        // recebe a resposta do back
        const resultado = await resposta.json();

        // mostra a resposta no console
        console.log("Resposta do cadastro:", resultado);

        // mostra a mensagem na tela
        mensagem.textContent = resultado.mensagem;

        // se o cadastro deu certo
        if (resposta.ok) {
            console.log("UID da nutricionista:", resultado.uid);

            // depois de 1,5 segundo volta pro login
            setTimeout(function () {
                window.location.href = "login.html";
            }, 1500);
        }

    } catch (erro) {
        // mostra o erro no console
        console.error("Erro ao cadastrar nutricionista:", erro);

        // mostra uma mensagem pro usuario
        mensagem.textContent = "Erro ao conectar com o servidor.";
    }
});