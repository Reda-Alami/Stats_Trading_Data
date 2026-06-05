import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';

export default function DataPage() {
  // Session Persistence Initializations
  const [symbol, setSymbol] = useState(() => localStorage.getItem('data_symbol') || 'AAPL');
  const [dataInterval, setDataInterval] = useState(() => localStorage.getItem('data_interval') || '1d');
  const [dataPeriod, setDataPeriod] = useState(() => localStorage.getItem('data_period') || '1y');
  const [stockData, setStockData] = useState(() => JSON.parse(localStorage.getItem('data_stockData')) || []);
  const [chartType, setChartType] = useState(() => localStorage.getItem('data_chartType') || 'candlestick'); 

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 100;

  const intervals = { '1h': '1 Hour', '4h': '4 Hours', '1d': 'Daily', '1wk': 'Weekly' };
  
  const getValidPeriods = (interval) => {
    const allPeriods = { '1mo': '1 Month', '3mo': '3 Months', '6mo': '6 Months', '1y': '1 Year', '2y': '2 Years', '5y': '5 Years', 'max': 'Max' };
    if (interval === '1h' || interval === '4h') {
      const { '5y': _, max, ...validIntraday } = allPeriods;
      return validIntraday;
    }
    return allPeriods;
  };

  const currentValidPeriods = getValidPeriods(dataInterval);

  // Sync to Session Storage
  useEffect(() => {
    localStorage.setItem('data_symbol', symbol);
    localStorage.setItem('data_interval', dataInterval);
    localStorage.setItem('data_period', dataPeriod);
    localStorage.setItem('data_chartType', chartType);
    localStorage.setItem('data_stockData', JSON.stringify(stockData));
  }, [symbol, dataInterval, dataPeriod, chartType, stockData]);

  const handleDataIntervalChange = (e) => {
    const newInterval = e.target.value;
    setDataInterval(newInterval);
    if ((newInterval === '1h' || newInterval === '4h') && (dataPeriod === '5y' || dataPeriod === 'max')) {
      setDataPeriod('2y'); 
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [stockData]);

  const handleFetchData = async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const url = `http://localhost:8000/api/fetch_yahoo?symbol=${encodeURIComponent(symbol)}&period=${dataPeriod}&interval=${dataInterval}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.data && json.data.prices) {
        setStockData(json.data.prices);
      } else {
        throw new Error('Unexpected data format received from backend.');
      }
    } catch (err) {
      setDataError(err.message);
      setStockData([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handleDownloadData = () => {
    if (stockData.length === 0) return;
    const blob = new Blob([JSON.stringify({ symbol, interval: dataInterval, period: dataPeriod, prices: stockData }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol}_${dataInterval}_history.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(stockData.length / itemsPerPage);
  const paginatedData = stockData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const lineData = paginatedData.map(row => ({ x: new Date(row.Date || row.date).getTime(), y: Number(row.Close || row.close || 0) }));
  const candleData = paginatedData.map(row => ({
    x: new Date(row.Date || row.date).getTime(),
    y: [Number(row.Open || row.open || row.Close || row.close || 0), Number(row.High || row.high || row.Close || row.close || 0), Number(row.Low || row.low || row.Close || row.close || 0), Number(row.Close || row.close || 0)]
  }));

  const lineOptions = {
    chart: { type: 'area', height: 400, background: 'transparent', foreColor: '#94a3b8', toolbar: { show: true }, animations: { enabled: false } },
    colors: ['#089981'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    dataLabels: { enabled: false },
    stroke: { curve: 'straight', width: 2 },
    xaxis: { type: 'datetime' },
    yaxis: { labels: { formatter: (val) => val.toFixed(2) } },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    tooltip: { theme: 'dark', shared: true }
  };

  const candleOptions = {
    chart: { type: 'candlestick', height: 400, background: 'transparent', foreColor: '#94a3b8', toolbar: { show: true }, animations: { enabled: false } },
    xaxis: { type: 'datetime' },
    yaxis: { labels: { formatter: (val) => val.toFixed(2) } },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    plotOptions: { candlestick: { colors: { upward: '#089981', downward: '#f23645' }, wick: { useFillColor: true } } },
    tooltip: { theme: 'dark' }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' };

  return (
    <div>
      <h2 style={{ color: '#10b981', margin: '0 0 8px 0', fontSize: '22px' }}>Workspace 01: Historical Ticker Extraction</h2>
      <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>Supports stocks (AAPL), Forex (EURUSD=X), Gold (GC=F). Adjust interval to affect chart resolution.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px', alignItems: 'end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Symbol</label>
          <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} style={inputStyle} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Interval</label>
          <select value={dataInterval} onChange={handleDataIntervalChange} style={inputStyle}>
            {Object.entries(intervals).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Period</label>
          <select value={dataPeriod} onChange={e => setDataPeriod(e.target.value)} style={inputStyle}>
            {Object.entries(currentValidPeriods).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>Chart Type</label>
          <select value={chartType} onChange={e => setChartType(e.target.value)} style={inputStyle}>
            <option value="line">Line / Area Trace</option>
            <option value="candlestick">Candlestick</option>
          </select>
        </div>
        <button onClick={handleFetchData} disabled={dataLoading} style={{ background: '#10b981', border: 'none', borderRadius: '8px', padding: '10px 20px', color: '#0f172a', fontWeight: 'bold', cursor: 'pointer', height: '40px', opacity: dataLoading ? 0.7 : 1 }}>
          {dataLoading ? 'Fetching...' : 'Fetch Data'}
        </button>
      </div>

      {dataError && <div style={{ background: '#7f1d1d40', border: '1px solid #7f1d1d', padding: '12px', borderRadius: '8px', marginBottom: '24px', color: '#f87171' }}>{dataError}</div>}

      {stockData.length > 0 && (
        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '24px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '18px' }}>{symbol} <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 'normal' }}>| {intervals[dataInterval] || dataInterval}</span></h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button onClick={handleDownloadData} style={{ background: '#334155', border: '1px solid #475569', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                📥 Download JSON
              </button>
              <span style={{ fontSize: '12px', color: '#94a3b8', background: '#1e293b', padding: '4px 10px', borderRadius: '12px' }}>Showing {paginatedData.length} of {stockData.length} entries</span>
            </div>
          </div>
          
          {chartType === 'candlestick' ? <Chart options={candleOptions} series={[{ name: 'Candle', data: candleData }]} type="candlestick" height={400} /> : <Chart options={lineOptions} series={[{ name: 'Close Price', data: lineData }]} type="area" height={400} />}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
              <button onClick={() => setCurrentPage(p => Math.max(0, p-1))} disabled={currentPage === 0} style={{ padding: '8px 16px', background: currentPage === 0 ? '#1e293b' : '#334155', border: 'none', borderRadius: '6px', color: currentPage === 0 ? '#64748b' : '#fff', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>◀ Prev</button>
              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold' }}>Page {currentPage + 1} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages-1, p+1))} disabled={currentPage === totalPages-1} style={{ padding: '8px 16px', background: currentPage === totalPages-1 ? '#1e293b' : '#334155', border: 'none', borderRadius: '6px', color: currentPage === totalPages-1 ? '#64748b' : '#fff', cursor: currentPage === totalPages-1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Next ▶</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}