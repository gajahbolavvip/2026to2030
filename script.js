
const API_KEY = "dbe9ofpr01qm2ls014ggdbe9ofpr01qm2ls014h0";

const API_BASE = "https://finnhub.io/api/v1";
const symbols = ["PLTR", "MU"];

let selectedSymbol = "PLTR";
let selectedRange = "5";
let candleSeries = null;
let chart = null;

const $ = (id) => document.getElementById(id);

function formatUSD(value) {
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function setStatus(message) {
  $("chart-status").textContent = message;
}

async function getJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("API gagal: " + response.status);
  }

  return response.json();
}

async function loadQuote(symbol) {
  try {
    if (API_KEY.includes("MASUKKAN_API_KEY")) {
      throw new Error("Masukkan API Key Finnhub di script.js.");
    }

    const data = await getJSON(
      `${API_BASE}/quote?symbol=${symbol}&token=${API_KEY}`
    );

    if (!data || !data.c) {
      throw new Error("Data harga belum tersedia.");
    }

    const price = data.c;
    const change = data.d ?? 0;
    const percent = data.dp ?? 0;
    const prefix = change > 0 ? "+" : "";

    $(`${symbol.toLowerCase()}-price`).textContent = formatUSD(price);

    const changeElement = $(`${symbol.toLowerCase()}-change`);
    changeElement.textContent =
      `${prefix}${formatUSD(change)} (${prefix}${percent.toFixed(2)}%)`;

    changeElement.className =
      "change " + (change >= 0 ? "positive" : "negative");

    $(`${symbol.toLowerCase()}-updated`).textContent =
      data.t
        ? "Waktu data: " + new Date(data.t * 1000).toLocaleString()
        : "Harga saham USD";
  } catch (error) {
    $(`${symbol.toLowerCase()}-price`).textContent = "--";
    $(`${symbol.toLowerCase()}-change`).textContent = error.message;
    $(`${symbol.toLowerCase()}-change`).className = "change negative";
  }
}

function createChart() {
  const container = $("chart");

  if (!window.LightweightCharts) {
    setStatus("Library grafik gagal dimuat. Periksa koneksi internet.");
    return;
  }

  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: {
      background: { color: "rgba(9, 15, 29, 0)" },
      textColor: "#d5deed"
    },
    grid: {
      vertLines: { color: "rgba(150, 170, 200, 0.10)" },
      horzLines: { color: "rgba(150, 170, 200, 0.10)" }
    },
    rightPriceScale: {
      borderColor: "#354158"
    },
    timeScale: {
      borderColor: "#354158",
      timeVisible: true,
      secondsVisible: false
    },
    crosshair: {
      vertLine: { color: "#ff8c24" },
      horzLine: { color: "#ff8c24" }
    }
  });

  candleSeries = chart.addSeries(
    LightweightCharts.CandlestickSeries,
    {
      upColor: "#21d99b",
      downColor: "#ff5268",
      borderUpColor: "#21d99b",
      borderDownColor: "#ff5268",
      wickUpColor: "#21d99b",
      wickDownColor: "#ff5268"
    }
  );

  const resizeObserver = new ResizeObserver(() => {
    if (chart) {
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight
      });
    }
  });

  resizeObserver.observe(container);
}

function getCandleParams(range) {
  const now = Math.floor(Date.now() / 1000);
  let resolution = range;
  let seconds = 60 * 60 * 24;

  if (range === "5") seconds = 60 * 60 * 24 * 5;
  if (range === "15") seconds = 60 * 60 * 24 * 10;
  if (range === "60") seconds = 60 * 60 * 24 * 30;
  if (range === "D") seconds = 60 * 60 * 24 * 365;
  if (range === "W") {
    resolution = "W";
    seconds = 60 * 60 * 24 * 365 * 5;
  }

  return {
    resolution,
    from: now - seconds,
    to: now
  };
}

async function loadCandles() {
  if (!candleSeries) return;

  if (API_KEY.includes("MASUKKAN_API_KEY")) {
    setStatus("Masukkan API Key Finnhub di script.js untuk memuat grafik.");
    return;
  }

  setStatus(`Memuat grafik ${selectedSymbol}...`);

  try {
    const params = getCandleParams(selectedRange);

    const url =
      `${API_BASE}/stock/candle?symbol=${selectedSymbol}` +
      `&resolution=${params.resolution}` +
      `&from=${params.from}&to=${params.to}&token=${API_KEY}`;

    const data = await getJSON(url);

    if (data.s !== "ok" || !data.t?.length) {
      throw new Error(
        "Data candlestick tidak tersedia. Periksa API Key, paket data, atau jam perdagangan."
      );
    }

    const candles = data.t.map((time, i) => ({
      time,
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i]
    }));

    candleSeries.setData(candles);
    chart.timeScale().fitContent();
    setStatus(`Grafik ${selectedSymbol} berhasil dimuat.`);
  } catch (error) {
    setStatus(error.message);
  }
}

$("symbol").addEventListener("change", (event) => {
  selectedSymbol = event.target.value;
  loadCandles();
});

document.querySelectorAll("[data-range]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedRange = button.dataset.range;

    document.querySelectorAll("[data-range]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    loadCandles();
  });
});

async function refreshQuotes() {
  for (const symbol of symbols) {
    await loadQuote(symbol);
  }
}

createChart();
refreshQuotes();
loadCandles();

// Pembaruan berkala; tidak menjamin harga tick-by-tick.
setInterval(refreshQuotes, 60000);
setInterval(loadCandles, 60000);
