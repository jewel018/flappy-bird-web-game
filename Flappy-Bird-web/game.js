const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const startButton = document.getElementById("startButton");

const W = canvas.width;
const H = canvas.height;

const images = {};

function loadImage(name, src) {
  const img = new Image();
  img.src = src;
  images[name] = img;
}

loadImage("background", "flappybirdbg.png");
loadImage("bird", "flappybird.png");
loadImage("topPipe", "toppipe.png");
loadImage("bottomPipe", "bottompipe.png");

const bird = {
  x: 70,
  y: 280,
  width: 34,
  height: 26,
  velocity: 0
};

const gravity = 0.38;
const flapStrength = -6.5;
const pipeWidth = 64;
const pipeGap = 165;
const pipeSpeed = 2.4;

let pipes = [];
let score = 0;
let highScore = 0;
let state = "ready";
let lastTime = 0;
let animationId = null;

function newPipe(x) {
  const minTop = 70;
  const maxTop = H - pipeGap - 100;

  const topHeight =
    minTop + Math.random() * (maxTop - minTop);

  return {
    x,
    topHeight,
    bottomY: topHeight + pipeGap,
    passed: false
  };
}

function resetGame() {
  bird.y = 280;
  bird.velocity = 0;

  score = 0;
  pipes = [
    newPipe(W + 80),
    newPipe(W + 320),
    newPipe(W + 560)
  ];
}

function startGame() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  resetGame();
  state = "playing";
  overlay.classList.add("hidden");

  lastTime = 0;
  animationId = requestAnimationFrame(gameLoop);
}

function flap() {
  if (state === "playing") {
    bird.velocity = flapStrength;
  }
}

function endGame() {
  state = "over";
  highScore = Math.max(highScore, score);

  overlayTitle.textContent = "Game Over!";
  overlayMessage.textContent =
    `Score: ${score} · Best: ${highScore}`;

  startButton.textContent = "Play Again";
  overlay.classList.remove("hidden");
}

function drawBackground() {
  if (images.background?.complete &&
      images.background.naturalWidth > 0) {
    ctx.drawImage(images.background, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, W, H);
  }
}

function drawPipe(pipe) {
  const topHeight = pipe.topHeight;
  const bottomHeight = H - pipe.bottomY;

  if (images.topPipe?.complete &&
      images.topPipe.naturalWidth > 0) {
    ctx.drawImage(
      images.topPipe,
      pipe.x, 0, pipeWidth, topHeight
    );
  } else {
    ctx.fillStyle = "#43b843";
    ctx.fillRect(pipe.x, 0, pipeWidth, topHeight);
  }

  if (images.bottomPipe?.complete &&
      images.bottomPipe.naturalWidth > 0) {
    ctx.drawImage(
      images.bottomPipe,
      pipe.x, pipe.bottomY, pipeWidth, bottomHeight
    );
  } else {
    ctx.fillStyle = "#43b843";
    ctx.fillRect(
      pipe.x, pipe.bottomY, pipeWidth, bottomHeight
    );
  }
}

function drawBird() {
  ctx.save();

  ctx.translate(
    bird.x + bird.width / 2,
    bird.y + bird.height / 2
  );

  const angle = Math.max(
    -0.45,
    Math.min(0.9, bird.velocity * 0.06)
  );

  ctx.rotate(angle);

  if (images.bird?.complete &&
      images.bird.naturalWidth > 0) {
    ctx.drawImage(
      images.bird,
      -bird.width / 2,
      -bird.height / 2,
      bird.width,
      bird.height
    );
  } else {
    ctx.fillStyle = "#ffcf45";
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(8, -5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(10, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff813d";
    ctx.beginPath();
    ctx.moveTo(13, 1);
    ctx.lineTo(24, 4);
    ctx.lineTo(13, 7);
    ctx.fill();
  }

  ctx.restore();
}

function drawScore() {
  ctx.textAlign = "center";
  ctx.font = "bold 36px Arial";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#263b43";
  ctx.fillStyle = "white";

  ctx.strokeText(String(score), W / 2, 55);
  ctx.fillText(String(score), W / 2, 55);
}

function collides(pipe) {
  const birdRight = bird.x + bird.width;
  const birdBottom = bird.y + bird.height;

  const overlapsPipe =
    birdRight > pipe.x &&
    bird.x < pipe.x + pipeWidth;

  if (!overlapsPipe) return false;

  return (
    bird.y < pipe.topHeight ||
    birdBottom > pipe.bottomY
  );
}

function update(delta) {
  const step = Math.min(delta / 16.67, 2.5);

  bird.velocity += gravity * step;
  bird.y += bird.velocity * step;

  if (bird.y < 0 || bird.y + bird.height > H) {
    endGame();
    return;
  }

  for (const pipe of pipes) {
    pipe.x -= pipeSpeed * step;

    if (collides(pipe)) {
      endGame();
      return;
    }

    if (!pipe.passed &&
        pipe.x + pipeWidth < bird.x) {
      pipe.passed = true;
      score++;
    }
  }

  if (pipes.length && pipes[0].x + pipeWidth < 0) {
    pipes.shift();
  }

  const lastPipe = pipes[pipes.length - 1];

  if (lastPipe && lastPipe.x < W - 220) {
    pipes.push(newPipe(W + 40));
  }
}

function render() {
  drawBackground();

  for (const pipe of pipes) {
    drawPipe(pipe);
  }

  drawBird();
  drawScore();
}

function gameLoop(timestamp) {
  if (state !== "playing") {
    animationId = null;
    return;
  }

  if (!lastTime) lastTime = timestamp;

  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  render();

  if (state === "playing") {
    animationId = requestAnimationFrame(gameLoop);
  } else {
    animationId = null;
    render();
  }
}

startButton.addEventListener("click", startGame);

canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  flap();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();

    if (state === "playing") {
      flap();
    }
  }
});

resetGame();
render();