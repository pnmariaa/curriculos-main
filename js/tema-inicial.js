// Aplica o tema escuro antes de a página ser desenhada, evitando o "piscar" do tema claro.
// Este arquivo é carregado logo no início do <body>, sem defer.
// Usa a mesma regra de js/main.js: a chave "theme" do localStorage tem prioridade
// sobre a preferência do sistema. main.js continua responsável pelo botão.
(() => {
  let salvo = null;
  try {
    salvo = localStorage.getItem("theme");
  } catch (erro) {
    // Armazenamento bloqueado: segue apenas a preferência do sistema.
  }
  const escuro = salvo ? salvo === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (escuro) document.body.classList.add("dark-mode");
})();
