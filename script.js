
const app = document.getElementById("app");
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

const intro = document.getElementById("intro");
const countdown = document.getElementById("countdown");
const titleScene = document.getElementById("title-scene");
const galleryScene = document.getElementById("gallery-scene");
const insideScene = document.getElementById("inside-scene");

const countNumber = document.getElementById("count-number");
const titleWord = document.getElementById("title-word");
const galleryButton = document.getElementById("gallery-button");
const galleryWorld = document.getElementById("gallery-world");
const insideWorld = document.getElementById("inside-world");
const replayButton = document.getElementById("replay");

// เพิ่มชื่อรูปที่มีจริงในโฟลเดอร์ images
const photoFiles = Array.from(
  { length: 16 },
  (_, i) => new URL(
    `images/photo${i + 1}.jpg`,
    document.baseURI
  ).href
);
// ปรับจำนวนรูปบนโลกและฉากด้านใน
const GALLERY_COLUMNS = 12;
const GALLERY_ROWS = 7;
const INSIDE_COLUMNS = 16;
const INSIDE_ROWS = 8;

let timers = [];
let started = false;
let entering = false;
let particles = [];

function later(callback, delay) {
  const id = setTimeout(callback, delay);
  timers.push(id);
  return id;
}

function clearTimers() {
  timers.forEach(id => clearTimeout(id));
  timers = [];
}

function showScene(scene) {
  [intro, countdown, titleScene, galleryScene, insideScene]
    .forEach(element => element.classList.remove("active"));

  scene.classList.add("active");
}

function animateNumber(value) {
  countNumber.textContent = value;
  countNumber.classList.remove("pop-number");
  void countNumber.offsetWidth;
  countNumber.classList.add("pop-number");

  burst(innerWidth / 2, innerHeight / 2, 32);
}

function animateTitle(word) {
  titleWord.textContent = word;
  titleWord.classList.remove("title-in");
  void titleWord.offsetWidth;
  titleWord.classList.add("title-in");

  burst(innerWidth / 2, innerHeight / 2, 45);
}

// Start: warp -> 3 -> 2 -> 1 -> birthday words
function startShow() {
  if (started) return;

  started = true;
  app.classList.add("rushing");

  later(() => {
    showScene(countdown);
    animateNumber(3);
  }, 900);

  later(() => animateNumber(2), 1900);
  later(() => animateNumber(1), 2900);

  later(() => {
    showScene(titleScene);
    animateTitle("HAPPY");
  }, 3900);

  later(() => animateTitle("BIRTHDAY"), 5200);
  later(() => animateTitle("MY LOVE ♡"), 6500);

  later(() => {
    app.classList.remove("rushing");
    showScene(galleryScene);
    revealGallery();
  }, 8000);
}

intro.addEventListener("click", startShow);

// Pastel particle effects
function resizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);

  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function randomPastel() {
  const colors = [
    "#ff8fbd",
    "#c5a7ff",
    "#8edfff",
    "#ffbd9e",
    "#ffe99e",
    "#ffffff"
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

function addParticle(x, y, burstMode = false) {
  const angle = Math.random() * Math.PI * 2;
  const speed = burstMode
    ? Math.random() * 4 + 1
    : Math.random() * 0.7 + 0.15;

  particles.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: burstMode ? Math.sin(angle) * speed : -speed,
    size: Math.random() * 4 + 1.5,
    color: randomPastel(),
    life: 1,
    burstMode,
    symbol: Math.random() > 0.65 ? "♡" : "✦"
  });
}

function burst(x, y, amount = 50) {
  for (let i = 0; i < amount; i++) {
    addParticle(x, y, true);
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  if (Math.random() < 0.3 && particles.length < 160) {
    addParticle(Math.random() * innerWidth, innerHeight + 10);
  }

  particles = particles.filter(p => p.life > 0);

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.color;

    if (p.burstMode) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.font = `${p.size * 4}px sans-serif`;
      ctx.fillText(p.symbol, p.x, p.y);
    }

    p.x += p.vx;
    p.y += p.vy;

    if (p.burstMode) {
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.vy += 0.015;
      p.life -= 0.018;
    } else {
      p.life -= 0.0025;
      if (p.y < -20) p.life = 0;
    }
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  requestAnimationFrame(drawParticles);
}

// Image helpers
function getPhoto(index) {
  return photoFiles[index % photoFiles.length];
}

function makePhoto(src, className, index) {
  const image = document.createElement("img");

  image.className = className;
  image.src = src;
  image.alt = `Our memory ${index + 1}`;
  image.draggable = false;

  image.addEventListener("error", () => {
    console.warn(`ไม่พบรูปภาพ: ${src}`);
    image.style.display = "none";
  }, { once: true });

  image.addEventListener("load", () => {
  console.log("โหลดรูปสำเร็จ:", image.src);
});

image.addEventListener("error", () => {
  console.error("โหลดรูปไม่สำเร็จ:", image.src);
  image.style.display = "none";
});

  return image;
}

// Create a globe made from photos
function buildGallery() {
  galleryWorld.replaceChildren();

  const radius = Math.min(
    innerWidth * 0.31,
    innerHeight * 0.31,
    260
  );

  const tileWidth = Math.min(
    100,
    (2 * Math.PI * radius / GALLERY_COLUMNS) * 0.84
  );

  const tileHeight = Math.min(66, radius * 0.31);

  galleryWorld.style.left = "50%";
  galleryWorld.style.top = "50%";
  galleryWorld.style.width = "0";
  galleryWorld.style.height = "0";

  let index = 0;

  for (let row = 0; row < GALLERY_ROWS; row++) {
    const latitude = -72 + row * 144 / (GALLERY_ROWS - 1);
    const latRad = latitude * Math.PI / 180;
    const columns = Math.max(
      5,
      Math.round(GALLERY_COLUMNS * Math.cos(latRad))
    );

    for (let col = 0; col < columns; col++) {
      const angle = col * 360 / columns + (row % 2) * (180 / columns);
      const image = makePhoto(getPhoto(index), "gallery-tile", index);

      image.style.width = `${tileWidth}px`;
      image.style.height = `${tileHeight}px`;
      image.style.left = "0";
      image.style.top = "0";
      image.style.margin = `${-tileHeight / 2}px 0 0 ${-tileWidth / 2}px`;

      image.style.transform =
        `rotateY(${angle}deg) ` +
        `rotateX(${-latitude}deg) ` +
        `translateZ(${radius}px)`;

      galleryWorld.appendChild(image);
      index++;
    }
  }
}

function revealGallery() {
  const tiles = [...galleryWorld.querySelectorAll(".gallery-tile")];

  tiles.forEach((tile, index) => {
    later(() => tile.classList.add("visible"), 60 + index * 35);
  });

  later(() => burst(innerWidth / 2, innerHeight / 2, 80), 350);
}

// Create the immersive inner curved photo wall

function buildInsideWorld() {
  insideWorld.replaceChildren();

  // รัศมีใหญ่ขึ้นเพื่อให้ผนังรูปโค้งล้อมรอบมุมมอง
  const radius = Math.max(480, innerWidth * 0.78);


  // รูปเล็กลงและมีหลายรูปต่อแถว
  const columns = 18;
  const rows = 8;
  const tileWidth = Math.min(190, innerWidth * 0.23);
  const tileHeight = Math.min(125, innerHeight * 0.22);
  insideWorld.style.left = "50%";
  insideWorld.style.top = "50%";
  insideWorld.style.width = "0";
  insideWorld.style.height = "0";

  let index = 0;

  for (let row = 0; row < rows; row++) {
    const latitude = -65 + row * (130 / (rows - 1));
    const latitudeRad = latitude * Math.PI / 180;

    // ลดจำนวนรูปตรงขั้วบนและล่าง ให้โค้งเป็นทรงโลก
    const count = Math.max(
      8,
      Math.round(columns * Math.cos(latitudeRad))
    );

    for (let col = 0; col < count; col++) {
      const angle = col * 360 / count + (row % 2) * (180 / count);
      const image = makePhoto(getPhoto(index), "inside-tile", index);

      image.style.width = `${tileWidth}px`;
      image.style.height = `${tileHeight}px`;
      image.style.left = "0";
      image.style.top = "0";
      image.style.margin =
        `${-tileHeight / 2}px 0 0 ${-tileWidth / 2}px`;

      image.style.transform =
        `rotateY(${angle}deg) ` +
        `rotateX(${-latitude}deg) ` +
        `translateZ(${radius}px)`;

      image.style.animationDelay = `${Math.min(index * 10, 700)}ms`;

      insideWorld.appendChild(image);
      index++;
    }
  }
}


// Tap the globe to zoom inside

function enterGallery() {
  if (entering || !galleryScene.classList.contains("active")) return;

  entering = true;

  const rect = galleryButton.getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 100);
  galleryScene.classList.add("zooming");

  later(() => {
    galleryScene.classList.remove("active", "zooming");
    showScene(insideScene);

    // แสดงผนังรูปด้านในอีกครั้ง
    insideWorld.style.display = "block";
    insideWorld.style.visibility = "visible";

    // ให้รูปทยอยปรากฏ
    const tiles = insideWorld.querySelectorAll(".inside-tile");
    tiles.forEach((tile, index) => {
      tile.style.display = "block";
      tile.style.opacity = "0";
      tile.style.animation = "none";

      void tile.offsetWidth;

      tile.style.animation = `photo-appear .7s ease ${Math.min(index * 0.025, 1.2)}s forwards`;
    });

    burst(innerWidth / 2, innerHeight / 2, 80);
    entering = false;
  }, 1250);
}


galleryButton.addEventListener("click", enterGallery);

// Replay the whole experience
replayButton.addEventListener("click", () => {
  clearTimers();

  started = false;
  entering = false;

  app.classList.remove("rushing");
  galleryScene.classList.remove("zooming");

  showScene(intro);

  // Reset title and message animations
  titleWord.classList.remove("title-in");

  document.querySelectorAll(".love-line").forEach(line => {
    line.style.animation = "none";
    void line.offsetWidth;
    line.style.animation = "";
  });

  particles = [];
});

// Initialize
function rebuildScenes() {
  buildGallery();
  buildInsideWorld();
}

window.addEventListener("resize", () => {
  resizeCanvas();
  rebuildScenes();
});

resizeCanvas();
rebuildScenes();
requestAnimationFrame(drawParticles);
