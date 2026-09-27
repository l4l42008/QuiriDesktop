// pega o formulario de login
const formularioLogin = document.getElementById("formLogin");

// pega o local onde as mensagens serao mostradas
const mensagemLogin = document.getElementById("mensagemLogin");

// identifica qnd o formulário de login for enviado
formularioLogin.addEventListener("submit", async function (evento) {

    // impede q a página seja recarregada
    evento.preventDefault();

    // pega o email digitado
    const email = document.getElementById("email").value;

    // pega a senha digitada
    const senha = document.getElementById("senha").value;

    // organiza os dados do login
    const dados = {
        email,
        senha
    };

    try {
        // envia os dados para o back
        const resposta = await fetch("/api/nutricionista/login", {
            method: "POST",

            // informa q estamos enviando json
            headers: {
                "Content-Type": "application/json"
            },

            // transforma os dados em json
            body: JSON.stringify(dados)
        });

        // recebe a resposta do backend
        const resultado = await resposta.json();

        // verifica se o login foi aceito
        if (!resposta.ok) {
            mensagemLogin.textContent =
                resultado.mensagem || "E-mail ou senha inválidos.";
            return;
        }

        // salva o uid da nutricionista q logou
        localStorage.setItem("uidNutricionista", resultado.uid);

        // mostra a resposta no console
        console.log("Resposta do login:", resultado);

        // vai direto pro dashboard
        window.location.href = "dashboard.html";

    } catch (erro) {

        // mostra o erro no console
        console.error("Erro ao fazer login:", erro);

        // mostra qnd da erro pra o usuário
        mensagemLogin.textContent = "Erro ao conectar com o servidor.";
    }
});