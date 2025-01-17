const Stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'PYPL', 'TSLA', 'JPM', 'NVDA', 'NFLX', 'DIS'];
let currentStock = 'AAPL';
let currentRange = '1mo';
let currentData;

const chartElement = document.getElementById('chart');
const stockList = document.getElementById('stock-list');
const rangeButtons = document.querySelectorAll('.range-btn');

async function fetchStockData(stock, range) {
    try {
        const response = await fetch(`https://stocksapi-uhe1.onrender.com/api/stocks/getstocksdata?symbol=${stock}&range=${range}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const stocksData = data.stocksData;
        if (!Array.isArray(stocksData) || data.length === 0 || !stocksData[0][stock]) {
            throw new Error('Invalid data format received');
        }
        return stocksData[0][stock];
    } catch (error) {
        console.error('Error fetching stock data:', error);
        throw error;
    }
}

async function fetchStockProfile(stock) {
    const response = await fetch(`https://stocksapi-uhe1.onrender.com/api/stocks/getstocksprofiledata?symbol=${stock}`);
    return await response.json();
}

async function  fetchStockStats(stock) {
    const response = await fetch(`https://stocksapi-uhe1.onrender.com/api/stocks/getstockstatsdata?symbol=${stock}`);
    return await response.json();
}

function createChart(data, range) {

    if (!data || !data[range] || !Array.isArray(data[range].value) || !Array.isArray(data[range].timeStamp)) {
        console.error('Invalid or empty data received for chart');
        Plotly.newPlot(chartElement, [{
            type: 'scatter',
            x: [],
            y: []
        }], {
            title: 'Error: No data available',
            plot_bgcolor: '#000066',
            paper_bgcolor: '#000066',
            font: { color: '#ffffff' }
        });
        return;
    }

    const timestamps = data[range].timeStamp.map(ts => new Date(ts * 1000));
    const prices = data[range].value;

    const trace = {
        x: timestamps,
        y: prices,
        type: 'scatter',
        mode: 'lines', // Enable both line and markers
        line: {
            color: '#00ff00',
            width: 2
        },
        hoverinfo: 'y',
        hoverlabel: {
            bgcolor: '#333333',
            font: { color: '#ffffff' }
        }
        
    };

    const layout = {
        plot_bgcolor: '#000066',
        paper_bgcolor: '#000066',
        font: { color: '#ffffff' },
        xaxis: {
            linecolor: '#333333',
            title: 'Date',
            showgrid: false,
            rangeslider: { visible: false }
        },
        yaxis: {
            linecolor: '#333333',
            title: 'Price',
            showgrid: false,
        },
        margin: { l: 50, r: 50, t: 30, b: 30 },
        autosize: true,
        hovermode: 'x',
        spikedistance: -1,
        hoverdistance: -1,
        xaxis: {
            spikecolor: '#999999',
            spikemode: 'across',
            showline: true,
            showgrid: false
        },
        yaxis: {
            showspikes: false,
            showline: true,
            showgrid: false
        }
    };

    const config = {
        displayModeBar: false,
        responsive: true
    };

    Plotly.newPlot(chartElement, [trace], layout, config);
}

function formatPrice(price) {
    // console.log(`$${parseFloat(price).toFixed(3)}`);
    return `$${parseFloat(price).toFixed(3)}`;
}

function formatChange(change) {
    const percentage = (change).toFixed(2);
    return `${percentage}%`;
}

async function updateStockInfo(stock) {
    const stockDetails = await fetchStockProfile(currentStock);
    const statsData = await fetchStockStats(stock);
    
    const ssDetails = statsData.stocksStatsData[0][stock];

    document.getElementById('stock-symbol').textContent = stock;
    document.getElementById('stock-price').textContent = formatPrice(ssDetails.bookValue);
    
    const changeElement = document.getElementById('stock-change');
    const change = formatChange(ssDetails.profit);
    changeElement.textContent = change;
    changeElement.className = `stock-change ${ssDetails.profit >= 0 ? 'change-positive' : 'change-negative'}`;

    console.log(stockDetails.stocksProfileData[0][stock]);
    document.getElementById('stock-description').innerHTML = stockDetails.stocksProfileData[0][stock].summary;
}

function updateActiveButton(range) {
    rangeButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.range === range);
    });
}

async function updateChart() {
    try {
        const data = await fetchStockData(currentStock, currentRange);
        // console.log('Fetched data:', data); 
        createChart(data, currentRange);
        await updateStockInfo(currentStock);
        updateActiveButton(currentRange);
    } catch (error) {
        console.error('Error updating chart:', error);
        chartElement.innerHTML = '<p style="color: red;">Error loading chart data. Please try again later.</p>';
    }
}

async function createStockList() {
    const profileData = await fetchStockStats(currentStock);
    
    if(profileData == undefined) {
        return;
    }
    const stocksData = profileData.stocksStatsData[0];
    console.log(stocksData);
    for (const s of Stocks) {
        // console.log(s);
        let stock = stocksData[s]
        // console.log(stock);
        const li = document.createElement('li');
        li.className = 'stock-item';
        li.innerHTML = `
            <span class="stock-symbol-box">${s}</span>
            <div class="stock-price-info">
                <div>${formatPrice(stock.bookValue)}</div>
                <div class="stock-change ${stock.profit >= 0 ? 'change-positive' : 'change-negative'}">
                    ${formatChange(stock.profit)}
                </div>
            </div>
        `;
        
        li.addEventListener('click', async () => {
            document.querySelectorAll('.stock-item').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            currentStock = s;
            await updateChart();
        });
        
        stockList.appendChild(li);
        
        // if (stock === 'AAPL') {
        //     const profileData = await fetchStockStats(stock);
        //     const stocksData = profileData.stocksStatsData[0];
        //     let stockData = stocksData['AAPL']
        //     li.innerHTML = `
        //         <span class="stock-symbol-box">${stock}</span>
        //         <div class="stock-price-info">
        //             <div>${formatPrice(stockData.bookValue)}</div>
        //             <div class="stock-change ${stockData.profit >= 0 ? 'change-positive' : 'change-negative'}">
        //                 ${formatChange(stockData.profit)}
        //             </div>
        //         </div>
        //     `;
        //     li.classList.add('active');
        // }
    }
}

rangeButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentRange = button.dataset.range;
        updateChart();
    });
});

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await createStockList();
    await updateChart(); // Only fetch initial data for AAPL
});

