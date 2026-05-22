import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";


export default function Reports({ data }) {
  const rawData = data;

  // Date range state (defaults to last 30 days)
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Refs for canvases and chart instances
  const barRef = useRef(null);
  const lineRef = useRef(null);
  const barChartInst = useRef(null);
  const lineChartInst = useRef(null);

  // PDF ref
  const pdfRef = useRef(null);

  // Filtered transactions in selected range (inclusive)
  const filteredTx = useMemo(() => {
    if (!from || !to) return rawData.transactions;
    const start = new Date(from);
    const end = new Date(to);
    // normalize time
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return rawData.transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [rawData.transactions, from, to]);

  // Summary totals for filtered range
  const totalIncome = filteredTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = filteredTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // Daily aggregation for the line chart (Option A)
  const dailySeries = useMemo(() => {
    // Build date map from start to end
    const dateMap = {};
    const start = new Date(from);
    const end = new Date(to);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      dateMap[key] = { income: 0, expense: 0 };
    }

    filteredTx.forEach((t) => {
      const key = new Date(t.date).toISOString().slice(0, 10);
      if (!dateMap[key]) dateMap[key] = { income: 0, expense: 0 };
      dateMap[key][t.type] += t.amount;
    });

    const labels = Object.keys(dateMap).sort();
    const income = labels.map((l) => dateMap[l].income || 0);
    const expense = labels.map((l) => dateMap[l].expense || 0);

    return { labels, income, expense };
  }, [filteredTx, from, to]);

  // Category breakdown for the table
  const categoryTotals = useMemo(() => {
    return filteredTx
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
  }, [filteredTx]);

  // Create / update Bar Chart (Income vs Expense)
  useEffect(() => {
    const ctx = barRef.current;
    if (!ctx) return;

    // destroy existing
    if (barChartInst.current) {
      barChartInst.current.destroy();
      barChartInst.current = null;
    }

    barChartInst.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Income", "Expense"],
        datasets: [
          {
            label: "Amount (PKR)",
            data: [totalIncome, totalExpense],
            backgroundColor: [ "#22c55e", "#ef4444" ], // green, red
            borderRadius: 6,
            barThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => `${v}` },
          },
        },
      },
    });

    return () => {
      barChartInst.current?.destroy();
      barChartInst.current = null;
    };
  }, [totalIncome, totalExpense]);

  // Create / update Line Chart (daily trend)
  useEffect(() => {
    const ctx = lineRef.current;
    if (!ctx) return;

    if (lineChartInst.current) {
      lineChartInst.current.destroy();
      lineChartInst.current = null;
    }

    lineChartInst.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: dailySeries.labels,
        datasets: [
          {
            label: "Income",
            data: dailySeries.income,
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.08)",
            tension: 0.3,
            pointRadius: 2,
            fill: true,
          },
          {
            label: "Expense",
            data: dailySeries.expense,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239,68,68,0.08)",
            tension: 0.3,
            pointRadius: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false },
        },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { display: true, title: { display: true, text: "Date" } },
          y: { display: true, title: { display: true, text: "Amount (PKR)" }, beginAtZero: true },
        },
      },
    });

    return () => {
      lineChartInst.current?.destroy();
      lineChartInst.current = null;
    };
  }, [dailySeries]);

  // Modern PDF download: capture pdfRef
  const downloadPdf = async () => {
    if (!pdfRef.current) return;

    // capture the report area
    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfImgWidth = pageWidth - 20; // margins
    const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 10, 10, pdfImgWidth, pdfImgHeight);

    // Add a new page with the table (if content overflowing, simple approach)
    pdf.addPage();

    pdf.setFontSize(12);
    pdf.text(`Report Details (${from} → ${to})`, 14, 16);

    // Category table
    pdf.setFontSize(10);
    let y = 24;
    pdf.text("Category Breakdown", 14, y);
    y += 6;

    autoTable(pdf, {
  startY: y,
  head: [["Category", "Amount (PKR)"]],
  body: Object.entries(categoryTotals).map(([k, v]) => [k, v.toFixed(2)]),
  theme: "grid",
  styles: { fontSize: 9 },
  headStyles: { fillColor: [240, 240, 240] },
});


    // Detailed transactions after the table
    const finalY = pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 8 : y + 40;
    pdf.setFontSize(10);
    pdf.text("Detailed Transactions", 14, finalY);

    let ty = finalY + 6;
    const rowsPerPage = 25;
    filteredTx.forEach((t, idx) => {
      const line = `${t.date} — ${t.type.toUpperCase()} — ${t.category} — PKR ${t.amount}`;
      pdf.text(line, 14, ty);
      ty += 6;
      if ((idx + 1) % rowsPerPage === 0) {
        pdf.addPage();
        ty = 16;
      }
    });

    pdf.save(`Report_${from}_to_${to}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
       <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
  Reports
</h1>


        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />

          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <button
            onClick={downloadPdf}
            className="px-4 py-2 rounded-lg text-white font-semibold shadow-md"
            style={{
              background: "linear-gradient(90deg,#2563eb,#7c3aed)",
            }}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Summary cards with spacing (removed Net) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card">
          <div className="small">Total Income</div>
          <div className="big">PKR {totalIncome.toLocaleString()}</div>
        </div>

        <div className="card">
          <div className="small">Total Expense</div>
          <div className="big text-red-600">PKR {totalExpense.toLocaleString()}</div>
        </div>

        {/* placeholder to keep spacing — removed Net card */}
        <div />
      </div>

      {/* Large charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense bar (larger) */}
        <div className="card" style={{ minHeight: 320 }}>
          <div className="small mb-3">Income vs Expense</div>
          <div style={{ height: 260 }}>
            <canvas ref={barRef} id="barChart" />
          </div>
        </div>

        {/* Daily trend line (larger) */}
        <div className="card" style={{ minHeight: 320 }}>
          <div className="small mb-3">Daily Trend ({from} → {to})</div>
          <div style={{ height: 260 }}>
            <canvas ref={lineRef} id="lineChart" />
          </div>
        </div>
      </div>

      {/* Report content area that will be captured to PDF */}
      <div className="card" ref={pdfRef}>
        <div className="text-lg font-semibold mb-3">Report Details</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="small mb-1">Summary</div>
            <div className="text-sm">
              From: <b>{from}</b> — To: <b>{to}</b>
            </div>
            <div className="mt-2">
              <div>Total Income: PKR {totalIncome.toLocaleString()}</div>
              <div>Total Expense: PKR {totalExpense.toLocaleString()}</div>
              <div>Net: PKR {(totalIncome - totalExpense).toLocaleString()}</div>
            </div>
          </div>

          <div>
            <div className="small mb-1">Category Breakdown</div>
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categoryTotals).map(([cat, amt], i) => (
                  <tr key={cat || i}>
                    <td>{cat}</td>
                    <td>PKR {amt.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="small mb-2">Detailed Transactions</div>
        <div className="space-y-2">
          {filteredTx.map((t, i) => (
            <div key={t.id || i} className="text-sm">
              {t.date} — <b>{t.type.toUpperCase()}</b> — {t.category} — PKR {t.amount}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
