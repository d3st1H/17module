const cvs = document.getElementById("canvas");
const ctx = cvs.getContext("2d");
let frame = 0;
const DEGREE = Math.PI / 180;

const sprite = new Image();
sprite.src = "img/sprite.png";

const startBtn = {
    x: cvs.width / 2 - 41.5,
    y: 263,
    w: 83,
    h: 29,
};

const gameState = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2,
};

class Score {
    constructor() {
        this.best = parseInt(localStorage.getItem("best")) || 0;
        this.value = 0;
    }

    draw() {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";

        if (gameState.current == gameState.game) {
            ctx.lineWidth = 2;
            ctx.font = "35px Teko";
            const scoreText = this.value.toString();
            const textWidth = ctx.measureText(scoreText).width;
            ctx.fillText(scoreText, cvs.width / 2 - textWidth / 2, 50);
            ctx.strokeText(scoreText, cvs.width / 2 - textWidth / 2, 50);
        } else if (gameState.current == gameState.over) {
            ctx.font = "25px Teko";
            const scoreText = this.value.toString();
            const bestText = this.best.toString();
            const scoreTextWidth = ctx.measureText(scoreText).width;
            const bestTextWidth = ctx.measureText(bestText).width;
            ctx.fillText(scoreText, cvs.width / 2 - scoreTextWidth / 2, 166);
            ctx.strokeText(scoreText, cvs.width / 2 - scoreTextWidth / 2, 166);
            ctx.fillText(bestText, cvs.width / 2 - bestTextWidth / 2, 208);
            ctx.strokeText(bestText, cvs.width / 2 - bestTextWidth / 2, 208);
        }
    }

    reset() {
        this.value = 0;
    }
}

cvs.addEventListener("mousedown", function (e) {
    switch (gameState.current) {
        case gameState.getReady:
            gameState.current = gameState.game;
            break;
        case gameState.game:
            bird.flap();
            break;
        case gameState.over:
            let rect = cvs.getBoundingClientRect();
            let clickX = e.clientX - rect.left;
            let clickY = e.clientY - rect.top;
            if (
                clickX >= startBtn.x &&
                clickX <= startBtn.x + startBtn.w &&
                clickY >= startBtn.y &&
                clickY <= startBtn.y + startBtn.h
            ) {
                resetGame();
            }
            break;
    }
});

class Background {
    constructor(sX, sY, sW, sH, x, y, w, h, dx) {
        this.sX = sX;
        this.sY = sY;
        this.sW = sW;
        this.sH = sH; 
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.dx = dx;
        this.offset = 0;
    }

    draw() {
        for (let i = 0; i <= Math.ceil(cvs.width / this.sW); i++) {
            ctx.drawImage(sprite, this.sX, this.sY, this.sW, this.sH, this.x + i * this.sW - this.offset, this.y, this.sW, this.sH);
        }
    }

    update() {
        if (gameState.current == gameState.game) {
            this.offset += this.dx;
            if (this.offset >= this.sW) {
                this.offset = 0;
            }
        }
    }
}

class BirdPhysics {
    constructor() {
        this.x = 50;
        this.y = 300;
        this.speed = 0;
        this.gravity = 0.07;
        this.jump = 2.1;
        this.rotation = 0;
        this.frame = 0;
        this.period = gameState.current == gameState.getReady ? 10 : 5;
    }

    flap() {
        this.speed = -this.jump;
    }

    update() {
        this.period = gameState.current == gameState.getReady ? 10 : 5;
        this.frame += frame % this.period == 0 ? 1 : 0;
        this.frame = this.frame % 3;

        if (gameState.current == gameState.getReady) {
            this.y = 300;
            this.rotation = 0 * DEGREE;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;

            if (this.y + 13 >= cvs.height - fg.h) {
                this.y = cvs.height - fg.h - 13;
                if (gameState.current == gameState.game) {
                    gameState.current = gameState.over;
                }
            }

            if (this.y - 13 < 0) {
                this.y = 13;
                this.speed = 0;
            }

            if (this.speed >= this.jump) {
                this.rotation = 90 * DEGREE;
                this.frame = 1;
            } else if (this.speed >= this.jump / 2) {
                this.rotation = 45 * DEGREE;
            } else {
                this.rotation = 0;
            }
        }
    }

    speedReset() {
        this.speed = 0;
    }
}

class Bird {
    constructor() {
        this.animation = [
            { sX: 276, sY: 112 },
            { sX: 276, sY: 139 },
            { sX: 276, sY: 164 },
        ];
        this.w = 34;
        this.h = 26;
        this.radius = 12;
        this.physics = new BirdPhysics();
    }

    draw() {
        let bird = this.animation[this.physics.frame];
        ctx.save();
        ctx.translate(this.physics.x, this.physics.y);
        ctx.rotate(this.physics.rotation);
        ctx.drawImage(sprite, bird.sX, bird.sY, this.w, this.h, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();

        if (gameState.current === gameState.getReady) {
            getReady.draw();
        } else if (gameState.current === gameState.over) {
            gameOver.draw();
        }
    }

    flap() {
        this.physics.flap();
    }

    update() {
        this.physics.update();
    }

    speedReset() {
        this.physics.speedReset();
    }

    reset() {
        this.physics.y = 300;
        this.physics.speed = 0;
        this.physics.frame = 0;
        gameState.current = gameState.getReady;
    }
}

class Pipe {
    constructor() {
        this.position = [];
        this.top = {
            sX: 553,
            sY: 0,
        };
        this.bottom = {
            sX: 502,
            sY: 0,
        };
        this.w = 53;
        this.h = 400;
        this.gap = 85;
        this.maxYPos = -150;
        this.dx = 1.75; //|-|
    }

    draw() {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topYPos = p.y;
            let bottomYPos = p.y + this.h + this.gap;
            ctx.drawImage(sprite, this.top.sX, this.top.sY, this.w, this.h, p.x, topYPos, this.w, this.h);
            ctx.drawImage(sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYPos, this.w, this.h);
        }
    }

    update() {
        if (gameState.current !== gameState.game) return;
        if (frame % 100 == 0) {
            this.position.push({
                x: cvs.width,
                y: this.maxYPos * (Math.random() + 1),
            });
        }

        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let bottomPipeYPos = p.y + this.h + this.gap;

            if (
                bird.physics.x + bird.radius > p.x &&
                bird.physics.x - bird.radius < p.x + this.w &&
                bird.physics.y + bird.radius > p.y &&
                bird.physics.y - bird.radius < p.y + this.h
            ) {
                gameState.current = gameState.over;
            }

            if (
                bird.physics.x + bird.radius > p.x &&
                bird.physics.x - bird.radius < p.x + this.w &&
                bird.physics.y + bird.radius > bottomPipeYPos &&
                bird.physics.y - bird.radius < bottomPipeYPos + this.h
            ) {
                gameState.current = gameState.over;
            }

            p.x -= this.dx;

            if (p.x + this.w <= 0) {
                this.position.shift();
                score.value += 1;
                score.best = Math.max(score.value, score.best);
                localStorage.setItem("best", score.best);
            }
        }
    }

    reset() {
        this.position = [];
    }
}

class Message {
    constructor(sX, sY, w, h, x, y) {
        this.sX = sX;
        this.sY = sY;
        this.w = w;
        this.h = h;
        this.x = x;
        this.y = y;
    }

    draw() {
        if (gameState.current === gameState.getReady) {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y - 105, this.w, this.h);
        } else if (gameState.current === gameState.over) {
            ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, cvs.width / 2 - this.w / 2, this.y - 150, this.w, this.h);
        }
    }
}

const getReady = new Message(0, 228, 173, 152, cvs.width / 2 - 173 / 2, 200);
const gameOver = new Message(175, 228, 225, 202, cvs.width / 2 - 225 / 2, 240);
const bg = new Background(0, 0, 288, 512, 0, cvs.height - 226, cvs.width, 226, 3);
const fg = new Background(276, 0, 224, 112, 0, cvs.height - 112, cvs.width, 112, 2);
const bird = new Bird();
const pipes = new Pipe();
const score = new Score();

function update() {
    bird.update();
    fg.update();
    pipes.update();
}

function draw() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    bg.draw();
    pipes.draw();
    fg.draw();
    bird.draw();

    if (gameState.current === gameState.over) {
        ctx.drawImage(sprite, 0, 114, startBtn.w, startBtn.h, startBtn.x, startBtn.y, startBtn.w, startBtn.h);
    }

    if (gameState.current === gameState.over) {
        gameOver.draw();
    }

    if (gameState.current === gameState.getReady) {
        getReady.draw();
    }

    score.draw();
}

function loop() {
    update();
    bg.update();
    draw();
    frame++;
    requestAnimationFrame(loop);
}

function resetGame() {
    bird.reset();
    pipes.reset();
    score.reset();
    gameState.current = gameState.getReady;
}

loop();