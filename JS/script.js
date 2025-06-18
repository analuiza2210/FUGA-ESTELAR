const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function carregarImagem(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const imagens = {
  nave: carregarImagem("./IMG/nave.png"),
  dia: carregarImagem("./IMG/dia.png"),
  noite: carregarImagem("./IMG/noite.png"),
  meteoro: carregarImagem("./IMG/carrovoador.png"),
  espaco: carregarImagem("./IMG/fundocolorido.png"),
  estrela: carregarImagem("./IMG/estrela.png"),
  meteoroEspaco: carregarImagem("./IMG/meteoro.png"),
  buracoNegro: carregarImagem("./IMG/buraconegrinho.png"),
};

const musicaFundo = new Audio("./SND/efeitofundo.mp3");
musicaFundo.loop = true;
musicaFundo.volume = 0.5;

let fase = "dia";
let vidas = 7;
let y = canvas.height / 2 - 50;
const naveSpeed = 4;
const naveLargura = 100;
const naveAltura = 60;
let obstaculos = [];
let estrelas = [];
let tempoUltimoObstaculo = 0;
let tempoUltimaEstrela = 0;
let tempoInicioFase = Date.now();
const keys = {};
let pontuacao = 0;
let estrelasColetadas = 0;
let novaMensagem = false;
let entrouNoEspaco = false;
let estado = "inicio";
let pausado = false;
let buracoNegroAtivo = false;
let xBuracoNegro = canvas.width;
let yBuracoNegro = canvas.height / 2 - 75;
let limpezaFeita = false;
let escalaNave = 1;
let mostrarMensagemBuraco = false;

function getNaveBoundingBox() {
  return {
    x: 100,
    y: y + (100 - naveAltura) / 2,
    w: naveLargura,
    h: naveAltura
  };
}

function colidiu(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function criarObstaculo() {
  const tamanho = fase === "espaco" ? 100 : Math.random() * 30 + 80;
  obstaculos.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - tamanho),
    w: tamanho,
    h: tamanho,
    pontuado: false
  });
}

function criarEstrela() {
  estrelas.push({ x: canvas.width, y: Math.random() * (canvas.height - 80), w: 80, h: 80 });
}

function atualizarObstaculos() {
  obstaculos.forEach(obs => {
    obs.x -= fase === "dia" ? 4 : fase === "noite" ? 6 : 5;

    if (!obs.pontuado && obs.x + obs.w < 100) {
      pontuacao++;
      obs.pontuado = true;
    }
  });

  obstaculos = obstaculos.filter(obs => obs.x + obs.w > 0);
}

function atualizarEstrelas() {
  estrelas.forEach(e => { e.x -= 3; });
  estrelas = estrelas.filter(e => e.x + e.w > 0);
}

function verificarColisoes() {
  const naveBox = getNaveBoundingBox();

  for (let i = 0; i < obstaculos.length; i++) {
    const obs = obstaculos[i];
    const folga = 20;
    const box = { x: obs.x + folga, y: obs.y + folga, w: obs.w - folga * 2, h: obs.h - folga * 2 };
    if (colidiu(naveBox, box)) {
      vidas--;
      obstaculos.splice(i, 1);
      i--;
      if (vidas <= 0) {
        estado = "fim";
      }
    }
  }

  for (let i = 0; i < estrelas.length; i++) {
    if (colidiu(naveBox, estrelas[i])) {
      estrelas.splice(i, 1);
      estrelasColetadas++;
      i--;
    }
  }
}

function alternarFase() {
  if (novaMensagem) return;
  const tempoDecorrido = (Date.now() - tempoInicioFase) / 1000;
  if (tempoDecorrido >= 30) {
    fase = fase === "dia" ? "noite" : "dia";
    tempoInicioFase = Date.now();
  }
}

function atualizar() {
  if (estado !== "jogando" || pausado) return;

  if (keys["arrowup"] || keys["w"]) y -= naveSpeed;
  if (keys["arrowdown"] || keys["s"]) y += naveSpeed;
  y = Math.max(0, Math.min(canvas.height - 100, y));

  if (!novaMensagem) alternarFase();

  if (pontuacao >= 50 && estrelasColetadas >= 50 && !limpezaFeita) {
    obstaculos = [];
    estrelas = [];
    limpezaFeita = true;
  }

  let podeGerarObstaculo = true;
  if ((fase === "espaco" && buracoNegroAtivo) || (pontuacao >= 50 && estrelasColetadas >= 50)) {
    podeGerarObstaculo = false;
  }

  if ((fase === "dia" || fase === "noite") && novaMensagem) {
    podeGerarObstaculo = false;
  }

  if (podeGerarObstaculo) {
    tempoUltimoObstaculo++;
    if (tempoUltimoObstaculo > (fase === "dia" ? 90 : fase === "noite" ? 40 : 70)) {
      criarObstaculo();
      tempoUltimoObstaculo = 0;
    }
  }

  if (novaMensagem && !entrouNoEspaco) {
    setTimeout(() => {
      fase = "espaco";
      entrouNoEspaco = true;
    }, 2000);
  }

  if (fase === "espaco") {
    tempoUltimaEstrela++;
    if (tempoUltimaEstrela > 80 && estrelasColetadas < 50) {
      criarEstrela();
      tempoUltimaEstrela = 0;
    }
  }

  if (fase === "espaco" && estrelasColetadas >= 50 && !buracoNegroAtivo) {
    buracoNegroAtivo = true;
    xBuracoNegro = canvas.width;
  }

  if (buracoNegroAtivo) {
    xBuracoNegro -= 2;
    if (xBuracoNegro <= canvas.width / 2 - 75) {
      xBuracoNegro = canvas.width / 2 - 75;
      mostrarMensagemBuraco = true;
      estado = "final"; // Mostrar mensagem final e parar animação da nave
    }

    const naveBox = getNaveBoundingBox();
    const buraco = { x: xBuracoNegro, y: yBuracoNegro, w: 150, h: 150 };

    if (estado !== "finalizando" && estado !== "final") {
      if (naveBox.x < xBuracoNegro) {
        y += (canvas.height / 2 - y - naveAltura / 2) * 0.05;
      }

      if (colidiu(naveBox, buraco)) {
        estado = "finalizando";
      }
    }
  }

  if (estado === "finalizando") {
    const centroX = xBuracoNegro + 75 - (naveLargura * escalaNave) / 2;
    const centroY = yBuracoNegro + 75 - (naveAltura * escalaNave) / 2;
    const naveBox = getNaveBoundingBox();

    const dx = centroX - naveBox.x;
    const dy = centroY - naveBox.y;

    y += dy * 0.05;

    escalaNave -= 0.01;
    if (escalaNave < 0.1) escalaNave = 0.1;

    if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && escalaNave <= 0.11) {
      estado = "final";
    }

    return;
  }

  atualizarObstaculos();
  atualizarEstrelas();
  verificarColisoes();

  if (pontuacao >= 50 && !novaMensagem) {
    novaMensagem = true;
    obstaculos = [];
  }
}

function desenhar() {
  let bgImg = fase === "dia" ? imagens.dia : fase === "noite" ? imagens.noite : imagens.espaco;
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  if (estado === "inicio") {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.fillText("Clique para Começar", canvas.width / 2 - 150, canvas.height / 2);
    return;
  }

  obstaculos.forEach(obs => {
    const img = fase === "espaco" ? imagens.meteoroEspaco : imagens.meteoro;
    ctx.drawImage(img, obs.x, obs.y, obs.w, obs.h);
  });

  estrelas.forEach(e => {
    ctx.drawImage(imagens.estrela, e.x, e.y, e.w, e.h);
  });

  const naveBox = getNaveBoundingBox();
  ctx.save();
  ctx.translate(naveBox.x + naveBox.w / 2, naveBox.y + naveBox.h / 2);
  ctx.scale(escalaNave, escalaNave);
  ctx.drawImage(imagens.nave, -naveBox.w / 2, -naveBox.h / 2, naveBox.w, naveBox.h);
  ctx.restore();

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";

  if (fase !== "espaco") {
    const texto = `Vidas: ${vidas}      Pontos: ${pontuacao}`;
    ctx.fillText(texto, canvas.width / 2 - ctx.measureText(texto).width / 2, 30);
  } else {
    const texto = `Vidas: ${vidas}      Estrelas: ${estrelasColetadas}/50`;
    ctx.fillText(texto, canvas.width / 2 - ctx.measureText(texto).width / 2, 30);
  }

  if (novaMensagem && !entrouNoEspaco) {
    ctx.fillStyle = "yellow";
    ctx.font = "24px Arial";
    ctx.fillText("Atingiu 50 pontos!", canvas.width / 2 - 90, 60);
    ctx.fillText("Hora de voltar para o espaço!", canvas.width / 2 - 160, 90);
  }

  if (buracoNegroAtivo) {
    ctx.drawImage(imagens.buracoNegro, xBuracoNegro, yBuracoNegro, 150, 150);
  }

  if (pausado && estado === "jogando") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.fillText("Jogo Pausado", canvas.width / 2 - 120, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Pressione 'P' para continuar", canvas.width / 2 - 130, canvas.height / 2 + 40);
    return;
  }

  if (estado === "fim") {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2 - 40);
    ctx.font = "24px Arial";
    ctx.fillText(`Pontuação: ${pontuacao}`, canvas.width / 2 - 80, canvas.height / 2);
    ctx.fillText("Clique para Jogar Novamente", canvas.width / 2 - 160, canvas.height / 2 + 100);
  }

  if (estado === "final") {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    const mensagem = "Parabéns, Missão Concluída!";
    ctx.fillText(mensagem, canvas.width / 2 - ctx.measureText(mensagem).width / 2, canvas.height / 2 - 20);

    ctx.font = "24px Arial";
    const cliqueTexto = "Clique para Jogar Novamente";
    ctx.fillText(cliqueTexto, canvas.width / 2 - ctx.measureText(cliqueTexto).width / 2, canvas.height / 2 + 30);
  }
}

function reiniciarJogo() {
  vidas = 7;
  obstaculos = [];
  estrelas = [];
  tempoInicioFase = Date.now();
  fase = "dia";
  y = canvas.height / 2 - 50;
  pontuacao = 0;
  estrelasColetadas = 0;
  tempoUltimoObstaculo = 0;
  tempoUltimaEstrela = 0;
  estado = "jogando";
  novaMensagem = false;
  entrouNoEspaco = false;
  pausado = false;
  buracoNegroAtivo = false;
  xBuracoNegro = canvas.width;
  limpezaFeita = false;
  escalaNave = 1;
  mostrarMensagemBuraco = false;
}

function loop() {
  atualizar();
  desenhar();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === "p" && estado === "jogando") pausado = !pausado;
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

document.addEventListener("click", () => {
  if (estado === "inicio" || estado === "fim" || estado === "final") {
    reiniciarJogo();
    if (musicaFundo.paused) musicaFundo.play();
  }
});

loop();
