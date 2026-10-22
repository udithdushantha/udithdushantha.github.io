/* Tiny pixel-sprite engine: sprites are strings (or generated grids) painted onto <canvas>
   elements at 1 px per cell, then scaled up with CSS (image-rendering: pixelated). */
(function () {
  'use strict';

  /* ---------- palettes ---------- */
  var FROG_BASE = { d: '#1f4d2b', w: '#ffffff', k: '#14142b', r: '#f08c8c' };
  function frogPal(g, l, extra) {
    var p = { g: g, l: l };
    for (var k in FROG_BASE) p[k] = FROG_BASE[k];
    for (var e in (extra || {})) p[e] = extra[e];
    return p;
  }
  var PALETTES = {
    green:  frogPal('#4caf3a', '#c4ee8c'),
    orange: frogPal('#f08a24', '#ffdca6', { d: '#7d3408' }),
    blue:   frogPal('#3b82d6', '#b5dcff', { d: '#16336e' }),
    yellow: frogPal('#f2cf2c', '#fff4b8', { d: '#7a5f00' }),
    red:    frogPal('#6dbf3a', '#d5f5a0', { w: '#ff4d4d', d: '#245a1e' })
  };
  var BONE = { o: '#f4ecd6', p: '#e3d6b3', d: '#7d6b4a' };
  var SHELL = { o: '#ecd9a8', p: '#d3b97d', d: '#7d5f2c' };
  var TRILO = { o: '#c9b79a', p: '#a99577', d: '#5b4a35' };

  /* ---------- hand-drawn grids ---------- */
  var FROG = [
    '..dddd....dddd..',
    '.dwwwwd..dwwwwd.',
    '.dwkkwd..dwkkwd.',
    '.dggggddddggggd.',
    'dggggggggggggggd',
    'dgrrggggggggrrgd',
    'dgggkkkkkkkkkggd',
    '.dggllllllllggd.',
    'dgggllllllllllgd',
    'dgggglllllllgggd',
    '.dddggggggggddd.',
    'dgggd..dd..dgggd',
    'dddddd....dddddd'
  ];

  var BONE_GRID = [
    '.dd..........dd.',
    'dood........dood',
    'doooddddddddoood',
    'dooooooooooooood',
    'doopddddddddpood',
    'dood........dood',
    '.dd..........dd.'
  ];

  var DRAGONFLY = [
    '...ww.ww....',
    '..wwww.www..',
    '.rbbbbbbbbb.',
    '..wwww.www..',
    '...ww.ww....'
  ];

  /* ---------- procedural helper ---------- */
  // mask(x,y) -> bool, color(x,y) -> char, edge -> outline char
  function proc(w, h, mask, color, edge) {
    var m = [], y, x, rows = [];
    for (y = 0; y < h; y++) { m[y] = []; for (x = 0; x < w; x++) m[y][x] = !!mask(x, y); }
    function on(xx, yy) { return yy >= 0 && yy < h && xx >= 0 && xx < w && m[yy][xx]; }
    for (y = 0; y < h; y++) {
      var row = '';
      for (x = 0; x < w; x++) {
        if (!m[y][x]) { row += '.'; continue; }
        var isEdge = !(on(x - 1, y) && on(x + 1, y) && on(x, y - 1) && on(x, y + 1));
        row += isEdge ? (edge || 'd') : color(x, y);
      }
      rows.push(row);
    }
    return rows;
  }

  function ammonite() {
    var n = 18, c = (n - 1) / 2, pitch = 3.4;
    return proc(n, n,
      function (x, y) { return Math.hypot(x - c, y - c) <= c + 0.3; },
      function (x, y) {
        var dx = x - c, dy = y - c, r = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
        if (th < 0) th += Math.PI * 2;
        var ph = (((r - pitch * th / (Math.PI * 2)) % pitch) + pitch) % pitch;
        if (r < 1.6) return 'd';
        if (ph >= pitch * 0.66) return 'd';
        return (Math.floor(th * 7 / Math.PI) % 2) ? 'o' : 'p';
      });
  }

  function trilobite() {
    var W = 14, H = 19, cx = (W - 1) / 2;
    function half(y) {
      var t = (y - (H - 1) / 2) / (H / 2);
      return 6.6 * Math.sqrt(Math.max(0, 1 - t * t));
    }
    return proc(W, H,
      function (x, y) { return Math.abs(x - cx) <= half(y); },
      function (x, y) {
        var dx = Math.abs(x - cx);
        if (y <= 5) return dx < 1.8 ? 'p' : 'o';          // head shield + glabella
        if (y <= 14) return (dx < 1.2 || y % 2 === 0) ? 'p' : 'o'; // segmented thorax
        return dx < 1.2 ? 'p' : 'o';                       // tail
      });
  }

  function sun() {
    var n = 17, c = 8;
    var rows = [];
    for (var y = 0; y < n; y++) {
      var row = '';
      for (var x = 0; x < n; x++) {
        var dx = x - c, dy = y - c, r = Math.hypot(dx, dy);
        var ax = Math.abs(dx), ay = Math.abs(dy);
        var ray = r > 5.8 && r <= 8.4 && (ax < 1 || ay < 1 || Math.abs(ax - ay) < 0.9);
        if (r <= 4.7) row += r > 3.7 ? 'o' : 'y';
        else if (ray) row += 'o';
        else row += '.';
      }
      rows.push(row);
    }
    return rows;
  }

  function moon() {
    var n = 17, c = 8;
    return proc(n, n,
      function (x, y) {
        var a = Math.hypot(x - c, y - c) <= 6.2;
        var b = Math.hypot(x - c - 3.2, y - c + 2.2) <= 5.4;
        return a && !b;
      },
      function (x, y) { return (x === 5 && y === 11) || (x === 6 && y === 7) ? 'p' : 'y'; },
      'o');
  }

  function cloud() {
    var circles = [[5, 6, 3.2], [10.5, 4, 4.2], [16, 6, 3.4]];
    return proc(22, 10,
      function (x, y) {
        if (y >= 6 && y <= 8 && x >= 3 && x <= 18) return true;
        for (var i = 0; i < circles.length; i++) {
          if (Math.hypot(x - circles[i][0], y - circles[i][1]) <= circles[i][2]) return true;
        }
        return false;
      },
      function () { return 'w'; },
      'g');
  }

  function lilypad() {
    return proc(18, 7,
      function (x, y) {
        var a = (x - 8.5) / 8.8, b = (y - 3) / 3.4;
        if (a * a + b * b > 1) return false;
        if (y <= 3 && x >= 12 && x <= 14 && y >= 3 - (x - 11)) return false; // notch
        return true;
      },
      function (x, y) { return y <= 2 ? 'l' : 'g'; });
  }

  function drop() {
    return proc(11, 15,
      function (x, y) {
        if (y < 7) return Math.abs(x - 5) <= y * 0.75;
        return Math.hypot(x - 5, y - 9.5) <= 5;
      },
      function (x, y) { return (x === 3 && y >= 9 && y <= 11) ? 'w' : 'b'; });
  }

  function xray() {
    return proc(14, 16,
      function () { return true; },
      function (x, y) {
        var shaft = x >= 5 && x <= 8 && y >= 3 && y <= 12;
        var knob = (y === 3 || y === 12 || y === 2 || y === 13) && x >= 4 && x <= 9;
        return (shaft || knob) ? 'w' : 'b';
      });
  }

  /* ---------- registry ---------- */
  var SPRITES = {
    frog:      { grid: FROG, pal: PALETTES.green },
    bone:      { grid: BONE_GRID, pal: BONE },
    dragonfly: { grid: DRAGONFLY, pal: { w: 'rgba(210,240,255,.85)', b: '#2c8a9e', r: '#c0392b' } },
    ammonite:  { grid: ammonite(), pal: SHELL },
    trilobite: { grid: trilobite(), pal: TRILO },
    sun:       { grid: sun(), pal: { y: '#ffd93b', o: '#f28c1d' } },
    moon:      { grid: moon(), pal: { y: '#f6f1c8', p: '#d3cc9a', o: '#a8a26e' } },
    cloud:     { grid: cloud(), pal: { w: '#ffffff', g: '#a9c7e4' } },
    lilypad:   { grid: lilypad(), pal: { g: '#3f9b3c', l: '#6cc455', d: '#1f5f2a' } },
    drop:      { grid: drop(), pal: { b: '#5ec1ff', w: '#e8f7ff', d: '#1d5fa8' } },
    xray:      { grid: xray(), pal: { b: '#2d5b9a', w: '#eaf3ff', d: '#14142b' } }
  };

  /* ---------- rendering ---------- */
  function paint(canvas, name, palName, scale) {
    var s = SPRITES[name];
    if (!s) return;
    var pal = (name === 'frog' && palName && PALETTES[palName]) ? PALETTES[palName] : s.pal;
    var grid = s.grid, h = grid.length, w = grid[0].length;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = (w * scale) + 'px';
    canvas.style.height = (h * scale) + 'px';
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var ch = grid[y].charAt(x);
        if (ch === '.' || !pal[ch]) continue;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function renderCanvas(canvas, night) {
    var name = canvas.getAttribute('data-sprite');
    if (name === 'sun' && night) name = 'moon';
    paint(canvas, name, canvas.getAttribute('data-pal'), parseFloat(canvas.getAttribute('data-scale')) || 1);
  }

  window.Sprites = {
    paint: paint,
    renderAll: function (root, night) {
      var list = (root || document).querySelectorAll('canvas[data-sprite]');
      for (var i = 0; i < list.length; i++) renderCanvas(list[i], !!night);
    },
    palettes: PALETTES,
    list: SPRITES
  };
})();
