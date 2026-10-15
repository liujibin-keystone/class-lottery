(function () {
  const names = window.CLASS_NAMES.slice();
  let remaining = names.slice();
  let drawn = [];
  let rotation = 0;
  let spinning = false;

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spin");
  const resetBtn = document.getElementById("reset");
  const overlay = document.getElementById("overlay");
  const winnerEl = document.getElementById("winner");
  const remainEl = document.getElementById("remain");
  const drawnEl = document.getElementById("drawnCount");
  const listEl = document.getElementById("list");
  const closeBtn = document.getElementById("close");
  const theme = getComputedStyle(document.documentElement).getPropertyValue("--theme").trim() || "#1b4f72";

  function hexToRgb(hex) {
    const h = hex.replace("#", "").trim();
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mix(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  function rgb(c) {
    return "rgb(" + c.r + "," + c.g + "," + c.b + ")";
  }

  const base = hexToRgb(theme);
  const light = mix(base, { r: 255, g: 248, b: 236 }, 0.72);
  const mid = mix(base, { r: 255, g: 255, b: 255 }, 0.28);
  const dark = mix(base, { r: 20, g: 18, b: 16 }, 0.18);

  function resize() {
    const size = Math.min(620, Math.floor(window.innerHeight * 0.72), document.querySelector(".wheel-wrap").clientWidth);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    const size = canvas.clientWidth;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 8;
    const n = Math.max(remaining.length, 1);
    const slice = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    if (remaining.length === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = rgb(light);
      ctx.fill();
      ctx.fillStyle = rgb(dark);
      ctx.font = "700 28px PingFang SC, Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.rotate(-rotation);
      ctx.fillText("已全部抽完", 0, 0);
      ctx.restore();
      return;
    }

    remaining.forEach(function (name, i) {
      const start = i * slice - Math.PI / 2 - slice / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? rgb(mid) : rgb(light);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,253,248,0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      const midAngle = start + slice / 2;
      ctx.rotate(midAngle);
      const world = rotation + midAngle;
      const flipped = Math.cos(world) < 0;
      if (flipped) ctx.rotate(Math.PI);
      ctx.textAlign = flipped ? "left" : "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = i % 2 === 0 ? "#fffdf8" : rgb(dark);
      const fontSize = n > 16 ? 14 : n > 12 ? 16 : 18;
      ctx.font = "700 " + fontSize + "px PingFang SC, Microsoft YaHei, sans-serif";
      ctx.fillText(name, flipped ? -(r - 18) : r - 18, 0);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fillStyle = rgb(dark);
    ctx.fill();
    ctx.fillStyle = "#fffdf8";
    ctx.font = "700 18px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.rotate(-rotation);
    ctx.fillText(window.CLASS_ID, 0, 0);
    ctx.restore();
  }

  function renderList() {
    remainEl.textContent = remaining.length;
    drawnEl.textContent = drawn.length;
    if (!drawn.length) {
      listEl.innerHTML = '<div class="empty">还没有抽中的同学</div>';
      return;
    }
    listEl.innerHTML = drawn
      .map(function (name, i) {
        return "<li><span>" + name + "</span><em>第 " + (i + 1) + " 位</em></li>";
      })
      .join("");
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function spin() {
    if (spinning || remaining.length === 0) return;
    spinning = true;
    spinBtn.disabled = true;

    const n = remaining.length;
    const pick = Math.floor(Math.random() * n);
    const slice = (Math.PI * 2) / n;
    const targetMod = ((Math.PI * 2 - pick * slice) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const currentMod = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = targetMod - currentMod;
    if (delta < 0) delta += Math.PI * 2;
    delta += Math.PI * 2 * (5 + Math.floor(Math.random() * 3));

    const start = rotation;
    const duration = 4200 + Math.random() * 800;
    const t0 = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - t0) / duration);
      rotation = start + delta * easeOut(t);
      draw();
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        const winner = remaining.splice(pick, 1)[0];
        drawn.push(winner);
        spinning = false;
        spinBtn.disabled = remaining.length === 0;
        spinBtn.textContent = remaining.length === 0 ? "已全部抽完" : "再抽一次";
        renderList();
        draw();
        winnerEl.textContent = winner;
        overlay.classList.add("show");
      }
    }
    requestAnimationFrame(frame);
  }

  function reset() {
    if (spinning) return;
    remaining = names.slice();
    drawn = [];
    rotation = 0;
    spinBtn.disabled = false;
    spinBtn.textContent = "开始抽奖";
    overlay.classList.remove("show");
    renderList();
    draw();
  }

  spinBtn.addEventListener("click", spin);
  resetBtn.addEventListener("click", reset);
  closeBtn.addEventListener("click", function () {
    overlay.classList.remove("show");
  });
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) overlay.classList.remove("show");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && overlay.classList.contains("show")) {
      overlay.classList.remove("show");
    } else if (e.key === "Enter") {
      spin();
    } else if (e.key === "Escape") {
      overlay.classList.remove("show");
    }
  });
  window.addEventListener("resize", resize);

  resize();
  renderList();
})();
