/* ══════════════════════════════════════
   SPK Metode SAW & WP — JavaScript
   app.js
══════════════════════════════════════ */

/* ════════════════════════════════════
   DATA KRITERIA
════════════════════════════════════ */
const kriteria = [
  { kode: "C1", nama: "Pengalaman Kerja", bobot: 0.3, tipe: "benefit" },
  { kode: "C2", nama: "Kemampuan Komunikasi", bobot: 0.25, tipe: "benefit" },
  { kode: "C3", nama: "Kemampuan Kepemimpinan", bobot: 0.2, tipe: "benefit" },
  { kode: "C4", nama: "Pendidikan", bobot: 0.15, tipe: "benefit" },
  { kode: "C5", nama: "Prestasi Kerja", bobot: 0.1, tipe: "benefit" },
];

/* ════════════════════════════════════
     DATA ALTERNATIF (DEFAULT)
  ════════════════════════════════════ */
let alternatif = [
  { nama: "Gibran", nilai: [8, 7, 6, 8, 9] },
  { nama: "Mandi", nilai: [7, 9, 8, 7, 6] },
  { nama: "Usep", nilai: [9, 6, 7, 9, 8] },
  { nama: "Albert simanjuntak", nilai: [6, 8, 9, 6, 7] },
  { nama: "Eka Wahyu", nilai: [7, 7, 7, 8, 8] },
];

/* ════════════════════════════════════
     RENDER KRITERIA TABLE
  ════════════════════════════════════ */
function renderKriteria() {
  const tbody = document.querySelector("#critTable tbody");
  tbody.innerHTML = kriteria
    .map(
      (k) => `
      <tr>
        <td><b>${k.kode}</b></td>
        <td>${k.nama}</td>
        <td>${(k.bobot * 100).toFixed(0)}%</td>
        <td>
          <div style="background:var(--warm);border-radius:4px;overflow:hidden;height:6px;width:100px;display:inline-block;vertical-align:middle;">
            <div style="width:${
              k.bobot * 100
            }%;height:6px;background:var(--sage);border-radius:4px;"></div>
          </div>
        </td>
        <td>
          <span class="type-badge ${k.tipe}">
            ${k.tipe === "benefit" ? "Benefit ↑" : "Cost ↓"}
          </span>
        </td>
      </tr>
    `
    )
    .join("");
}

/* ════════════════════════════════════
     RENDER INPUT ALTERNATIF
  ════════════════════════════════════ */
function renderInputs() {
  const container = document.getElementById("altInputs");
  container.innerHTML = alternatif
    .map(
      (a, i) => `
      <div class="alt-card" id="alt-${i}">
        <div class="alt-num">${i + 1}</div>
  
        <div class="alt-name-input">
          <input
            type="text"
            value="${a.nama}"
            placeholder="Nama kandidat"
            onchange="alternatif[${i}].nama = this.value"
          />
        </div>
  
        <div class="alt-values">
          ${kriteria
            .map(
              (k, j) => `
            <div class="val-group">
              <input
                type="number"
                class="val-input"
                id="v-${i}-${j}"
                min="1" max="10" step="1"
                value="${a.nilai[j]}"
                title="${k.nama}"
                onchange="alternatif[${i}].nilai[${j}] = +this.value"
              />
              <div class="val-hint">${k.kode}</div>
            </div>
          `
            )
            .join("")}
        </div>
  
        ${
          alternatif.length > 2
            ? `<button class="btn-remove" onclick="removeAlt(${i})" title="Hapus kandidat">×</button>`
            : ""
        }
      </div>
    `
    )
    .join("");
}

/* ════════════════════════════════════
     TAMBAH / HAPUS ALTERNATIF
  ════════════════════════════════════ */
function addAlternatif() {
  const n = alternatif.length + 1;
  alternatif.push({ nama: `Kandidat ${n}`, nilai: [5, 5, 5, 5, 5] });
  renderInputs();
}

function removeAlt(i) {
  if (alternatif.length <= 2) return;
  alternatif.splice(i, 1);
  renderInputs();
}

/* ════════════════════════════════════
     ALGORITMA SAW
     Simple Additive Weighting
  ════════════════════════════════════ */
function hitungSAW() {
  const n = alternatif.length;
  const m = kriteria.length;

  // Langkah 1: Matriks Keputusan X
  const X = alternatif.map((a) => [...a.nilai]);

  // Langkah 2: Normalisasi → Matriks R
  const R = X.map((row) =>
    row.map((val, j) => {
      const kolom = X.map((r) => r[j]);
      if (kriteria[j].tipe === "benefit") {
        return val / Math.max(...kolom);
      } else {
        return Math.min(...kolom) / val;
      }
    })
  );

  // Langkah 3: Nilai Preferensi V
  const V = R.map((row) =>
    row.reduce((sum, val, j) => sum + kriteria[j].bobot * val, 0)
  );

  // Langkah 4: Ranking
  const ranked = alternatif
    .map((a, i) => ({ nama: a.nama, skor: V[i], idx: i }))
    .sort((a, b) => b.skor - a.skor);

  return { X, R, V, ranked };
}

/* ════════════════════════════════════
     ALGORITMA WP
     Weighted Product
  ════════════════════════════════════ */
function hitungWP() {
  // Langkah 1: Vektor S (produk terbobot)
  const S = alternatif.map((a) =>
    kriteria.reduce((prod, k, j) => {
      const exp = k.tipe === "benefit" ? k.bobot : -k.bobot;
      return prod * Math.pow(a.nilai[j], exp);
    }, 1)
  );

  // Langkah 2: Vektor V (normalisasi S)
  const sumS = S.reduce((a, b) => a + b, 0);
  const V = S.map((s) => s / sumS);

  // Langkah 3: Ranking
  const ranked = alternatif
    .map((a, i) => ({ nama: a.nama, skor: V[i], skorS: S[i], idx: i }))
    .sort((a, b) => b.skor - a.skor);

  return { S, V, ranked };
}

/* ════════════════════════════════════
     RENDER HASIL SAW
  ════════════════════════════════════ */
function renderSAW(res) {
  const { X, R, V, ranked } = res;
  const maxV = Math.max(...V);

  document.getElementById("saw-content").innerHTML = `
      <div class="steps">
        ${buildStep(
          1,
          "Matriks Keputusan (X)",
          `
          <p style="font-size:.83rem;color:var(--stone);margin-bottom:.8rem;">
            Nilai asli setiap alternatif pada tiap kriteria.
          </p>
          <div class="matrix-wrap">${buildMatrixTable(X, false, V)}</div>
        `
        )}
  
        ${buildStep(
          2,
          "Normalisasi Matriks (R)",
          `
          <div class="info-box">
            <b>Benefit:</b> r<sub>ij</sub> = x<sub>ij</sub> / max(x<sub>j</sub>)
            &nbsp;|&nbsp;
            <b>Cost:</b> r<sub>ij</sub> = min(x<sub>j</sub>) / x<sub>ij</sub>
          </div>
          <div class="matrix-wrap">${buildMatrixTable(R, true, V)}</div>
        `
        )}
  
        ${buildStep(
          3,
          "Nilai Preferensi (V)",
          `
          <p style="font-size:.83rem;color:var(--stone);margin-bottom:.8rem;">
            V<sub>i</sub> = &Sigma; (W<sub>j</sub> &times; r<sub>ij</sub>)
            &mdash; semakin tinggi nilainya, semakin baik alternatif tersebut.
          </p>
          ${buildRankList(ranked, maxV)}
        `
        )}
      </div>
    `;

  openAllSteps("saw-content");
}

/* ════════════════════════════════════
     RENDER HASIL WP
  ════════════════════════════════════ */
function renderWP(res) {
  const { S, V, ranked } = res;
  const maxV = Math.max(...V);

  document.getElementById("wp-content").innerHTML = `
      <div class="steps">
        ${buildStep(
          1,
          "Vektor S (Produk Terbobot)",
          `
          <div class="info-box">
            S<sub>i</sub> = &prod; (x<sub>ij</sub>)<sup>w<sub>j</sub></sup>
            &mdash; benefit: eksponen positif, cost: eksponen negatif.
          </div>
          <div class="matrix-wrap">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>Alternatif</th>
                  ${kriteria
                    .map((k) => `<th>${k.kode} (w=${k.bobot})</th>`)
                    .join("")}
                  <th>S<sub>i</sub></th>
                </tr>
              </thead>
              <tbody>
                ${alternatif
                  .map(
                    (a, i) => `
                  <tr>
                    <td>${a.nama}</td>
                    ${a.nilai
                      .map((v, j) => {
                        const exp =
                          kriteria[j].tipe === "benefit"
                            ? kriteria[j].bobot
                            : -kriteria[j].bobot;
                        return `<td>${v}<sup>${exp.toFixed(
                          2
                        )}</sup> = ${Math.pow(v, exp).toFixed(4)}</td>`;
                      })
                      .join("")}
                    <td><b>${S[i].toFixed(4)}</b></td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
        )}
  
        ${buildStep(
          2,
          "Vektor V (Normalisasi S)",
          `
          <div class="info-box">
            V<sub>i</sub> = S<sub>i</sub> / &Sigma;S
            &mdash; normalisasi agar total keseluruhan = 1.
          </div>
          ${buildRankList(ranked, maxV)}
        `
        )}
      </div>
    `;

  openAllSteps("wp-content");
}

/* ════════════════════════════════════
     RENDER PERBANDINGAN SAW vs WP
  ════════════════════════════════════ */
function renderCompare(sawRes, wpRes) {
  const data = alternatif
    .map((a, i) => {
      const sawRank = sawRes.ranked.findIndex((r) => r.idx === i) + 1;
      const wpRank = wpRes.ranked.findIndex((r) => r.idx === i) + 1;
      return {
        nama: a.nama,
        sawSkor: sawRes.V[i],
        wpSkor: wpRes.V[i],
        sawRank,
        wpRank,
      };
    })
    .sort((a, b) => a.sawRank - b.sawRank);

  const concordant = data.filter((d) => d.sawRank === d.wpRank).length;
  const pct = Math.round((concordant / data.length) * 100);

  const maxSaw = Math.max(...sawRes.V);
  const maxWp = Math.max(...wpRes.V);
  const sortedViz = [...data].sort((a, b) => b.sawSkor - a.sawSkor);

  document.getElementById("compare-content").innerHTML = `
      <!-- Rekomendasi Terbaik -->
      <div class="grid-2" style="margin-bottom:1.25rem;">
        <div class="card" style="border-left:3px solid var(--sage);">
          <div style="font-size:.8rem;color:var(--stone);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem;">
            Rekomendasi SAW
          </div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--sage-dk);">
            ${sawRes.ranked[0].nama}
          </div>
          <div style="font-size:.83rem;color:var(--stone);">
            Skor: ${sawRes.ranked[0].skor.toFixed(4)}
          </div>
        </div>
        <div class="card" style="border-left:3px solid var(--bark);">
          <div style="font-size:.8rem;color:var(--stone);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.3rem;">
            Rekomendasi WP
          </div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--bark-dk);">
            ${wpRes.ranked[0].nama}
          </div>
          <div style="font-size:.83rem;color:var(--stone);">
            Skor: ${wpRes.ranked[0].skor.toFixed(4)}
          </div>
        </div>
      </div>
  
      <!-- Tabel Perbandingan -->
      <div class="card">
        <div class="card-title"><span class="dot"></span> Tabel Perbandingan Peringkat</div>
        <div class="matrix-wrap">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Alternatif</th>
                <th>Skor SAW</th>
                <th>Rank SAW</th>
                <th>Skor WP</th>
                <th>Rank WP</th>
                <th>Kesesuaian</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (d) => `
                <tr>
                  <td>${d.nama}</td>
                  <td>${d.sawSkor.toFixed(4)}</td>
                  <td>${d.sawRank}</td>
                  <td>${d.wpSkor.toFixed(4)}</td>
                  <td>${d.wpRank}</td>
                  <td class="${
                    d.sawRank === d.wpRank ? "same-rank" : "diff-rank"
                  }">
                    ${d.sawRank === d.wpRank ? "✓ Sama" : "≠ Beda"}
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="info-box" style="margin-top:1rem;">
          <b>Tingkat Kesesuaian:</b> ${concordant} dari ${
    data.length
  } alternatif
          mendapat peringkat sama di kedua metode (${pct}%).
          ${
            pct >= 60
              ? " Kedua metode memberikan hasil yang <b>konsisten</b>."
              : " Terdapat perbedaan signifikan — pertimbangkan konteks lebih lanjut."
          }
        </div>
      </div>
  
      <!-- Visualisasi Bar Chart -->
      <div class="card" style="margin-top:1.25rem;">
        <div class="card-title"><span class="dot"></span> Visualisasi Perbandingan Skor</div>
        <div id="scoreViz">
          ${sortedViz
            .map(
              (d) => `
            <div class="score-item">
              <div class="score-name">${d.nama}</div>
              <div class="score-row">
                <span class="score-label saw">SAW</span>
                <div class="score-bar-track">
                  <div class="score-bar-fill saw" style="width:${(
                    (d.sawSkor / maxSaw) *
                    100
                  ).toFixed(1)}%;"></div>
                </div>
                <span class="score-val">${d.sawSkor.toFixed(4)}</span>
              </div>
              <div class="score-row">
                <span class="score-label wp">WP</span>
                <div class="score-bar-track">
                  <div class="score-bar-fill wp" style="width:${(
                    (d.wpSkor / maxWp) *
                    100
                  ).toFixed(1)}%;"></div>
                </div>
                <span class="score-val">${d.wpSkor.toFixed(4)}</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
}

/* ════════════════════════════════════
     HELPER: MATRIX TABLE HTML
  ════════════════════════════════════ */
function buildMatrixTable(data, isNorm, V) {
  const maxV = V ? Math.max(...V) : 0;

  return `
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Alternatif</th>
            ${kriteria
              .map(
                (k) => `
              <th>${k.kode}<br>
                <span style="font-size:.7rem;opacity:.7;">
                  ${k.tipe === "benefit" ? "↑" : "↓"}
                </span>
              </th>
            `
              )
              .join("")}
            ${isNorm ? "<th>V<sub>i</sub></th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${alternatif
            .map(
              (a, i) => `
            <tr>
              <td>${a.nama}</td>
              ${data[i]
                .map((v) => `<td>${isNorm ? v.toFixed(4) : v}</td>`)
                .join("")}
              ${
                isNorm
                  ? `
                <td style="font-weight:500;color:${
                  V[i] === maxV ? "var(--green-soft)" : "inherit"
                };">
                  ${V[i].toFixed(4)} ${V[i] === maxV ? "★" : ""}
                </td>
              `
                  : ""
              }
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
}

/* ════════════════════════════════════
     HELPER: RANK LIST HTML
  ════════════════════════════════════ */
function buildRankList(ranked, maxV) {
  return `
      <div class="rank-list">
        ${ranked
          .map(
            (r, pos) => `
          <div class="rank-item rank-${pos + 1}">
            <div class="rank-medal">${pos + 1}</div>
            <div class="rank-name">${r.nama}</div>
            <div class="rank-bar-wrap">
              <div class="rank-bar" style="width:${(
                (r.skor / maxV) *
                100
              ).toFixed(1)}%;"></div>
            </div>
            <div class="rank-score">${r.skor.toFixed(4)}</div>
            ${pos === 0 ? '<span class="winner-tag">Terbaik</span>' : ""}
          </div>
        `
          )
          .join("")}
      </div>
    `;
}

/* ════════════════════════════════════
     HELPER: STEP ACCORDION HTML
  ════════════════════════════════════ */
function buildStep(num, title, body) {
  return `
      <div class="step-item">
        <div class="step-head" onclick="toggleStep(this)">
          <div class="step-num">${num}</div>
          <div class="step-title">${title}</div>
          <div class="step-arrow">▾</div>
        </div>
        <div class="step-body">${body}</div>
      </div>
    `;
}

function toggleStep(head) {
  const body = head.nextElementSibling;
  const arrow = head.querySelector(".step-arrow");
  body.classList.toggle("open");
  arrow.classList.toggle("open");
}

function openAllSteps(containerId) {
  const el = document.getElementById(containerId);
  el.querySelectorAll(".step-body").forEach((b) => b.classList.add("open"));
  el.querySelectorAll(".step-arrow").forEach((a) => a.classList.add("open"));
}

/* ════════════════════════════════════
     MAIN: HITUNG SEMUA
  ════════════════════════════════════ */
function hitungSemua() {
  // Sinkronisasi nilai dari input DOM ke array data
  alternatif.forEach((a, i) => {
    kriteria.forEach((k, j) => {
      const el = document.getElementById(`v-${i}-${j}`);
      if (el) a.nilai[j] = +el.value || 5;
    });
    const nameEl = document.querySelector(`#alt-${i} input[type=text]`);
    if (nameEl) a.nama = nameEl.value.trim() || `Kandidat ${i + 1}`;
  });

  const sawRes = hitungSAW();
  const wpRes = hitungWP();

  renderSAW(sawRes);
  renderWP(wpRes);
  renderCompare(sawRes, wpRes);

  showToast("Perhitungan selesai! Lihat tab SAW, WP, dan Perbandingan.");
  switchTab("saw");
}

/* ════════════════════════════════════
     TAB NAVIGATION
  ════════════════════════════════════ */
function switchTab(name) {
  const tabOrder = ["input", "saw", "wp", "compare"];

  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));

  document.getElementById("tab-" + name).classList.add("active");
  const idx = tabOrder.indexOf(name);
  document.querySelectorAll(".tab-btn")[idx].classList.add("active");
}

/* ════════════════════════════════════
     TOAST NOTIFICATION
  ════════════════════════════════════ */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ════════════════════════════════════
     INISIALISASI
  ════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  renderKriteria();
  renderInputs();
});
