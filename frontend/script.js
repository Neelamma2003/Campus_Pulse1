let barChart, pieChart, lineChart, yearChart, majorChart;

// LOAD DATA
async function loadData() {

    let facility = document.getElementById("facility").value;
    let year = document.getElementById("year").value;
    let major = document.getElementById("major").value;

    let url = `http://127.0.0.1:5000/filter?facility=${facility}&year=${year}&major=${major}`;

    let res = await fetch(url);
    let data = await res.json();

    updateMetrics(data);
    createBarChart(data);
    createPieChart(data);
    createYearChart(data);
    createMajorChart(data);
    createLineChart(data);
    showInsights(data);
}

// METRICS
function updateMetrics(data) {

    let scores = data.map(d => d.satisfaction_score);

    let avg = (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2);
    let high = Math.max(...scores);
    let low = Math.min(...scores);

    let grouped = {};
    data.forEach(d => {
        if (!grouped[d.facility]) grouped[d.facility] = [];
        grouped[d.facility].push(d.satisfaction_score);
    });

    let best = Object.keys(grouped).reduce((a,b) =>
        grouped[a].reduce((x,y)=>x+y)/grouped[a].length >
        grouped[b].reduce((x,y)=>x+y)/grouped[b].length ? a : b
    );

    document.getElementById("avg").innerHTML = `⭐ Avg: ${avg}`;
    document.getElementById("high").innerHTML = `🔥 High: ${high}`;
    document.getElementById("low").innerHTML = `❄ Low: ${low}`;
    document.getElementById("top").innerHTML = `🏆 Top: ${best}`;
}

// COMMON OPTIONS
function chartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: "#e2e8f0" } }
        },
        scales: {
            x: { ticks: { color: "#cbd5f5" } },
            y: { ticks: { color: "#cbd5f5" } }
        }
    };
}

// BAR
function createBarChart(data) {

    // Always group ALL facilities
    let facilities = ["Library", "Cafeteria", "Sports", "Hostel"];

    let grouped = {
        "Library": [],
        "Cafeteria": [],
        "Sports": [],
        "Hostel": []
    };

    data.forEach(d => {
        if (grouped[d.facility]) {
            grouped[d.facility].push(d.satisfaction_score);
        }
    });

    let labels = facilities;

    let values = facilities.map(f => {
        let arr = grouped[f];
        if (arr.length === 0) return 0;
        return arr.reduce((a,b)=>a+b,0) / arr.length;
    });

    if (barChart) barChart.destroy();

    barChart = new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Facility Average Comparison",
                data: values,
                backgroundColor: [
                    "#60a5fa", // Library
                    "#34d399", // Cafeteria
                    "#fbbf24", // Sports
                    "#f87171"  // Hostel
                ]
            }]
        },
        options: chartOptions()
    });
}

// PIE
function createPieChart(data) {

    let selectedFacility = document.getElementById("facility").value;

    // Filter only selected facility (if chosen)
    let filteredData = selectedFacility
        ? data.filter(d => d.facility === selectedFacility)
        : data;

    // Count majors
    let counts = {
        "CSE": 0,
        "ECE": 0,
        "MECH": 0,
        "CIVIL": 0
    };

    filteredData.forEach(d => {
        counts[d.major]++;
    });

    let labels = Object.keys(counts);
    let values = Object.values(counts);

    if (pieChart) pieChart.destroy();

    pieChart = new Chart(document.getElementById("pieChart"), {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                label: "Major Contribution",
                data: values,
                backgroundColor: [
                    "#60a5fa", // CSE
                    "#34d399", // ECE
                    "#fbbf24", // MECH
                    "#f87171"  // CIVIL
                ],
                borderColor: "#1e293b",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#e2e8f0",
                        padding: 15
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let total = context.dataset.data.reduce((a,b)=>a+b,0);
                            let value = context.raw;
                            let percent = ((value / total) * 100).toFixed(1);

                            return `${context.label}: ${percent}%`;
                        }
                    }
                }
            }
        }
    });
}
// YEAR
function createYearChart(data) {
    let grouped = {};
    data.forEach(d => {
        if (!grouped[d.academic_year]) grouped[d.academic_year] = [];
        grouped[d.academic_year].push(d.satisfaction_score);
    });

    let labels = Object.keys(grouped);
    let values = labels.map(k => grouped[k].reduce((a,b)=>a+b)/grouped[k].length);

    if (yearChart) yearChart.destroy();

    yearChart = new Chart(document.getElementById("yearChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Year Avg",
                data: values,
                backgroundColor: "#38bdf8"
            }]
        },
        options: chartOptions()
    });
}

// MAJOR
function createMajorChart(data) {
    let grouped = {};
    data.forEach(d => {
        if (!grouped[d.major]) grouped[d.major] = [];
        grouped[d.major].push(d.satisfaction_score);
    });

    let labels = Object.keys(grouped);
    let values = labels.map(k => grouped[k].reduce((a,b)=>a+b)/grouped[k].length);

    if (majorChart) majorChart.destroy();

    majorChart = new Chart(document.getElementById("majorChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Major Avg",
                data: values,
                backgroundColor: "#a78bfa"
            }]
        },
        options: chartOptions()
    });
}

// LINE
function createLineChart(data) {

    // Sort by time
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let y = data.map(d => d.satisfaction_score);
    let n = y.length;

    let x = y.map((_, i) => i + 1);

    // 🔥 LINEAR REGRESSION (REAL DATA)
    let sumX = x.reduce((a,b)=>a+b,0);
    let sumY = y.reduce((a,b)=>a+b,0);
    let sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    let sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    let slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    let intercept = (sumY - slope * sumX) / n;

    // 🔮 Predict next 10 values
    let predicted = [];
    let futureX = [];

    for (let i = 1; i <= 10; i++) {
        let xi = n + i;
        let yi = slope * xi + intercept;

        yi = Math.max(1, Math.min(5, yi)); // clamp

        predicted.push(yi);
        futureX.push(xi);
    }

    let labels = x;
    let futureLabels = futureX;

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(document.getElementById("lineChart"), {
        type: "line",
        data: {
            labels: [...labels, ...futureLabels],
            datasets: [
                {
                    label: "Actual Satisfaction",
                    data: y,
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56,189,248,0.2)",
                    fill: false,
                    tension: 0.2,
                    pointRadius: 3
                },
                {
                    label: "Predicted Trend",
                    data: [
                        ...Array(n - 1).fill(null),
                        y[n - 1],
                        ...predicted
                    ],
                    borderColor: "#22c55e",
                    borderDash: [6,6],
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: { color: "#e2e8f0" }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let v = context.raw;

                            if (v >= 4) return `Excellent (${v.toFixed(2)})`;
                            if (v >= 3) return `Good (${v.toFixed(2)})`;
                            return `Needs Improvement (${v.toFixed(2)})`;
                        }
                    }
                }
            },

            scales: {
                x: {
                    ticks: { color: "#cbd5f5" },
                    title: {
                        display: true,
                        text: "Responses (Time)",
                        color: "#e2e8f0"
                    }
                },
                y: {
                    min: 1,
                    max: 5,
                    ticks: { color: "#cbd5f5" },
                    title: {
                        display: true,
                        text: "Satisfaction Score",
                        color: "#e2e8f0"
                    }
                }
            }
        }
    });
}
// INSIGHTS
function showInsights(data) {

    let facilities = ["Library", "Cafeteria", "Sports", "Hostel"];

    let html = "<h2>📊 Facility Performance</h2>";

    let totalAvg = 0;
    let count = 0;

    facilities.forEach(f => {

        let filtered = data.filter(d => d.facility === f);
        if (filtered.length === 0) return;

        let avg = filtered.reduce((a,b)=>a+b.satisfaction_score,0) / filtered.length;

        totalAvg += avg;
        count++;

        // 🔥 Calculate percentage (out of 5)
        let percent = (avg / 5) * 100;

        let color = "";
        let status = "";

        if (avg >= 4) {
            color = "#22c55e";
            status = "✔ Excellent";
        }
        else if (avg >= 3) {
            color = "#facc15";
            status = "🙂 Good";
        }
        else {
            color = "#ef4444";
            status = "❌ Needs Improvement";
        }

        html += `
            <div style="margin:15px 0">

                <div style="display:flex; justify-content:space-between;">
                    <span>${f}</span>
                    <span>${avg.toFixed(2)} ${status}</span>
                </div>

                <div style="
                    width:100%;
                    background:#334155;
                    border-radius:10px;
                    height:12px;
                    margin-top:5px;
                ">
                    <div style="
                        width:${percent}%;
                        background:${color};
                        height:12px;
                        border-radius:10px;
                        transition:0.5s;
                    "></div>
                </div>

            </div>
        `;
    });

    let overall = totalAvg / count;

    let overallText = overall >= 4 ? "Excellent 😍" :
                      overall >= 3 ? "Good 🙂" :
                      "Needs Improvement ⚠";

    html += `
        <hr style="margin:15px 0; border-color:#334155">

        <h3>Overall Performance: ${overallText}</h3>
    `;

    document.getElementById("insightBox").innerHTML = html;
}