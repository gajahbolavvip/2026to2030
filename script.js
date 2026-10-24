
const API_KEY = "dbe9ofpr01qm2ls014ggdbe9ofpr01qm2ls014h0";

const symbols = ["PLTR", "MU"];

function formatUSD(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

async function loadOneStock(symbol) {
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
  );

  if (!response.ok) {
    throw new Error("Gagal mengambil data " + symbol);
  }

  const data = await response.json();

  if (
    !Number.isFinite(data.c) ||
    data.c <= 0 ||
    !Number.isFinite(data.pc) ||
    data.pc <= 0
  ) {
    throw new Error("Data harga " + symbol + " tidak tersedia");
  }

  document.getElementById(`price-${symbol}`).textContent =
    formatUSD(data.c);

  const change = data.c - data.pc;
  const percent = (change / data.pc) * 100;
  const changeElement = document.getElementById(`change-${symbol}`);

  changeElement.textContent =
    `${change >= 0 ? "+" : ""}${formatUSD(change)} ` +
    `(${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%) dibanding penutupan sebelumnya`;

  changeElement.className =
    "change " + (change >= 0 ? "up" : "down");

  document.getElementById(`open-${symbol}`).textContent =
    formatUSD(data.o);

  document.getElementById(`high-${symbol}`).textContent =
    formatUSD(data.h);

  document.getElementById(`low-${symbol}`).textContent =
    formatUSD(data.l);

  document.getElementById(`prev-${symbol}`).textContent =
    formatUSD(data.pc);
}

async function loadStocks() {
  const button = document.getElementById("refreshButton");
  button.disabled = true;
  button.textContent = "MEMUAT DATA...";

  try {
    if (!API_KEY || API_KEY === "MASUKKAN_API_KEY_KAMU") {
      throw new Error("Masukkan API key Finnhub terlebih dahulu.");
    }

    const results = await Promise.allSettled(
      symbols.map(symbol => loadOneStock(symbol))
    );

    const failed = results.filter(
      result => result.status === "rejected"
    );

    if (failed.length > 0) {
      throw new Error(
        "Sebagian data gagal dimuat. Periksa API key, koneksi, atau batas API."
      );
    }

    document.getElementById("updateTime").textContent =
      "Pembaruan: " +
      new Date().toLocaleTimeString("id-ID");
  } catch (error) {
    document.getElementById("updateTime").textContent =
      "Data gagal dimuat";

    console.error(error);
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "↻ PERBARUI HARGA";
  }
}

loadStocks();

// Coba memperbarui data setiap 60 detik.
setInterval(loadStocks, 60000);
