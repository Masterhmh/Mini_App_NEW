<script>
    const urlParams = new URLSearchParams(window.location.search);
    const apiUrl = urlParams.get('api');
    const sheetId = urlParams.get('sheetId');

    if (!apiUrl || !sheetId) {
      alert("Thiếu thông tin API hoặc Sheet ID. Vui lòng kiểm tra lại URL!");
    }

    window.openTab = function(tabId) {
      console.log("Opening tab: " + tabId);
      const tabs = document.querySelectorAll('.nav-item');
      const contents = document.querySelectorAll('.tab-content');
      tabs.forEach(tab => tab.classList.remove('active'));
      contents.forEach(content => content.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');
    };

   window.fetchData = async function() {
  const startDateInput = document.getElementById('startDate').value;
  const endDateInput = document.getElementById('endDate').value;
  console.log("Fetching data from: " + startDateInput + " to: " + endDateInput);
  if (!startDateInput || !endDateInput) {
    alert("Vui lòng chọn khoảng thời gian!");
    return;
  }
  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);
  if (startDate > endDate) {
    alert("Ngày bắt đầu không thể lớn hơn ngày kết thúc!");
    return;
  }

  try {
    const financialResponse = await fetch(`${apiUrl}?action=getFinancialSummary&startDate=${startDateInput}&endDate=${endDateInput}&sheetId=${sheetId}`);
    const financialData = await financialResponse.json();
    console.log("Financial data received: ", financialData);
    if (financialData.error) {
      throw new Error(financialData.error);
    }
    updateFinancialData(financialData);

    const chartResponse = await fetch(`${apiUrl}?action=getChartData&startDate=${startDateInput}&endDate=${endDateInput}&sheetId=${sheetId}`);
    const chartData = await chartResponse.json();
    console.log("Chart data received: ", chartData);
    if (chartData.error) {
      throw new Error(chartData.error);
    }
    updateChartData(chartData);
  } catch (error) {
    console.error("Error fetching data: ", error);
    alert("Lỗi khi lấy dữ liệu: " + error.message);
    updateFinancialData({ error: true });
  }
};

    function updateFinancialData(data) {
    console.log("Updating financial data with: ", data);
    const container = document.getElementById('statsContainer');

    // Nếu không có dữ liệu hoặc có lỗi, hiển thị mặc định
    if (!data || data.error) {
        console.log("No data or error detected");
        container.innerHTML = `
            <div class="stat-box income">
                <div class="title">Tổng thu nhập</div>
                <div class="amount">Không có dữ liệu</div>
            </div>
            <div class="stat-box expense">
                <div class="title">Tổng chi tiêu</div>
                <div class="amount">Không có dữ liệu</div>
            </div>
            <div class="stat-box balance">
                <div class="title">Số dư</div>
                <div class="amount">Không có dữ liệu</div>
            </div>
        `;
        return;
    }

    // Lấy giá trị từ dữ liệu, mặc định là 0 nếu không có
    const totalIncome = Number(data.income) || 0;  // Nếu không có thu nhập, đặt là 0
    const totalExpense = Number(data.expense) || 0;  // Nếu không có chi tiêu, đặt là 0

    // Nếu cả thu nhập và chi tiêu đều là 0, hiển thị "Không có dữ liệu"
    if (totalIncome === 0 && totalExpense === 0) {
        container.innerHTML = `
            <div class="stat-box income">
                <div class="title">Tổng thu nhập</div>
                <div class="amount">Không có dữ liệu</div>
            </div>
            <div class="stat-box expense">
                <div class="title">Tổng chi tiêu</div>
                <div class="amount">Không có dữ liệu</div>
            </div>
            <div class="stat-box balance">
                <div class="title">Số dư</div>
                <div class="amount">Không có dữ liệu</div>
            </div>
        `;
        return;
    }

    // Tính số dư nếu có ít nhất một giá trị khác 0
    const balance = totalIncome - totalExpense;

    // Cập nhật giao diện với dữ liệu thực tế
    container.innerHTML = `
        <div class="stat-box income">
            <div class="title">Tổng thu nhập</div>
            <div class="amount">${totalIncome.toLocaleString('vi-VN')}đ</div>
        </div>
        <div class="stat-box expense">
            <div class="title">Tổng chi tiêu</div>
            <div class="amount">${totalExpense.toLocaleString('vi-VN')}đ</div>
        </div>
        <div class="stat-box balance">
            <div class="title">Số dư</div>
            <div class="amount">${balance.toLocaleString('vi-VN')}đ</div>
        </div>
    `;
}
    function updateChartData(response) {
      if (response.error) {
        alert(response.error);
        if (window.myChart && typeof window.myChart.destroy === 'function') {
          window.myChart.destroy();
        }
        return;
      }
      const chartData = response.chartData;
      const categories = response.categories;
      const ctx = document.getElementById('myChart').getContext('2d');
      if (window.myChart && typeof window.myChart.destroy === 'function') {
        window.myChart.destroy();
      }
      const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0);
      const backgroundColors = [
        '#FF6B6B', '#FF9F45', '#FFE156', '#7DC95E', '#40C4FF',
        '#5A92FF', '#9B5DE5', '#FF66C4', '#FF7D7D', '#F88F70',
        '#54A0FF', '#C084FC', '#FF82A9', '#6DCFF6', '#FFACC5',
        '#E4C1F9', '#FF928B', '#FDCB98', '#B5E2FA', '#91E8BC',
        '#FFD166', '#FF8E72', '#E57373', '#74D3AE', '#43BCCD',
        '#D1B3E0', '#F78F8F', '#F6B17A', '#F4A261', '#FF6392',
        '#66D9E8', '#FF85A1', '#6A0572', '#FC7A57', '#A29BFE'
      ];
      const customLegend = document.getElementById('customLegend');
      customLegend.innerHTML = '';
      const leftColumn = document.createElement('div');
      leftColumn.className = 'custom-legend-column';
      const rightColumn = document.createElement('div');
      rightColumn.className = 'custom-legend-column';
      chartData.forEach((item, i) => {
        const index = categories.indexOf(item.category);
        const color = backgroundColors[index % backgroundColors.length];
        const percentage = ((item.amount / totalAmount) * 100).toFixed(1);
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
          <span class="legend-color" style="background-color: ${color};"></span>
          <span class="legend-text">
            ${item.category}:
            <span class="legend-value">${item.amount.toLocaleString('vi-VN')}đ (${percentage}%)</span>
          </span>
        `;
        if (i % 2 === 0) {
          leftColumn.appendChild(legendItem);
        } else {
          rightColumn.appendChild(legendItem);
        }
      });
      customLegend.appendChild(leftColumn);
      customLegend.appendChild(rightColumn);
      window.myChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: chartData.map(item => item.category),
          datasets: [{
            data: chartData.map(item => item.amount),
            backgroundColor: chartData.map(item => {
              const index = categories.indexOf(item.category);
              return backgroundColors[index % backgroundColors.length];
            })
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(tooltipItem) {
                  const category = tooltipItem.label;
                  const amount = tooltipItem.raw;
                  const percentage = ((amount / totalAmount) * 100).toFixed(1);
                  return `${category}: ${amount.toLocaleString('vi-VN')}đ (${percentage}%)`;
                }
              },
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: { size: 12 },
              bodyFont: { size: 10 },
              titleColor: '#fff',
              bodyColor: '#fff',
              padding: 8,
              displayColors: true,
            },
            datalabels: {
              formatter: (value, context) => {
                const percentage = ((value / totalAmount) * 100).toFixed(1);
                return percentage >= 1 ? `${value.toLocaleString('vi-VN')}đ (${percentage}%)` : '';
              },
              color: '#fff',
              font: { weight: 'bold', size: 12 },
              anchor: 'end',
              align: 'end',
              clamp: true
            }
          }
        }
      });
    }

    window.fetchMonthlyData = async function() {
    const startMonth = parseInt(document.getElementById('startMonth').value);
    const endMonth = parseInt(document.getElementById('endMonth').value);
    const year = new Date().getFullYear();
    console.log("Fetching monthly data from month: " + startMonth + " to: " + endMonth);
    if (startMonth > endMonth) {
        alert("Tháng bắt đầu không thể lớn hơn tháng kết thúc!");
        return;
    }

    try {
        const response = await fetch(`${apiUrl}?action=getMonthlyData&year=${year}&sheetId=${sheetId}`);
        const monthlyData = await response.json();
        console.log("Monthly data received: ", monthlyData);
        if (monthlyData.error) {
            throw new Error(monthlyData.error);
        }

        // Tạo mảng đầy đủ 12 tháng, điền dữ liệu từ API, nếu không có thì điền 0
        const fullYearData = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const existingData = monthlyData.find(item => item.month === month);
            return existingData || { month, income: 0, expense: 0 };
        });

        // Lọc dữ liệu từ startMonth đến endMonth, đảm bảo tất cả các tháng trong khoảng đều có mặt
        const filteredData = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => {
            const month = startMonth + i;
            const existingData = fullYearData.find(item => item.month === month);
            return existingData || { month, income: 0, expense: 0 };
        });

        updateMonthlyChart(filteredData);
    } catch (error) {
        console.error("Error fetching monthly data: ", error);
        alert("Lỗi khi lấy dữ liệu biểu đồ tháng: " + error.message);
        // Nếu có lỗi, hiển thị tất cả các tháng từ startMonth đến endMonth với giá trị 0
        const filteredData = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => ({
            month: startMonth + i,
            income: 0,
            expense: 0
        }));
        updateMonthlyChart(filteredData);
    }
};

function updateMonthlyChart(filteredData) {
    console.log("Updating monthly chart with data: ", filteredData);
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (window.monthlyChart && typeof window.monthlyChart.destroy === 'function') {
        window.monthlyChart.destroy();
    }

    if (!filteredData || filteredData.length === 0) {
        window.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Không có dữ liệu'],
                datasets: [
                    { label: 'Thu nhập', data: [0], backgroundColor: '#10B981' },
                    { label: 'Chi tiêu', data: [0], backgroundColor: '#EF4444' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Số tiền (đ)', font: { size: 14 } }, 
                        ticks: { font: { size: 12 } } 
                    },
                    x: { 
                        title: { display: true, text: 'Tháng', font: { size: 14 } }, 
                        ticks: { font: { size: 12 } } 
                    }
                },
                plugins: {
                    legend: { display: true, labels: { font: { size: 12 } } },
                    tooltip: {
                        titleFont: { size: 12 },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: function(tooltipItem) {
                                return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString('vi-VN')}đ`;
                            }
                        }
                    },
                    datalabels: { display: false }
                }
            }
        });
        document.getElementById('monthlyLegend').innerHTML = '<div>Không có dữ liệu</div>';
        return;
    }

    const labels = filteredData.map(item => `Tháng ${item.month}`);
    const incomes = filteredData.map(item => item.income);
    const expenses = filteredData.map(item => item.expense);

    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Thu nhập', data: incomes, backgroundColor: '#10B981', borderColor: '#10B981', borderWidth: 1 },
                { label: 'Chi tiêu', data: expenses, backgroundColor: '#EF4444', borderColor: '#EF4444', borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Số tiền (đ)', font: { size: 14 } },
                    ticks: {
                        callback: function(value) { return value.toLocaleString('vi-VN') + 'đ'; },
                        font: { size: 12 }
                    }
                },
                x: {
                    title: { display: true, text: 'Tháng', font: { size: 14 } },
                    ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: false // Đảm bảo không bỏ qua nhãn nào
                    }
                }
            },
            plugins: {
                legend: { display: true, labels: { font: { size: 12 } } },
                tooltip: {
                    titleFont: { size: 12 },
                    bodyFont: { size: 12 },
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString('vi-VN')}đ`;
                        }
                    }
                },
                datalabels: {
                    display: true,
                    align: 'end',
                    anchor: 'end',
                    formatter: (value) => value.toLocaleString('vi-VN') + 'đ',
                    color: '#1F2A44',
                    font: { weight: 'bold', size: 12 }
                }
            }
        }
    });

    const monthlyLegend = document.getElementById('monthlyLegend');
    monthlyLegend.innerHTML = '';
    const column = document.createElement('div'); // Chỉ tạo 1 cột duy nhất
    column.className = 'monthly-column';

    // Liệt kê tất cả các tháng theo thứ tự
    filteredData.forEach(item => {
        const difference = item.income - item.expense;
        const diffClass = difference >= 0 ? 'positive' : 'negative';
        const diffIcon = difference >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        const monthItem = document.createElement('div');
        monthItem.className = 'month-item';
        monthItem.innerHTML = `
            <h3>Tháng ${item.month}:</h3>
            <p><span class="color-box" style="background-color: #10B981;"></span>Tổng thu nhập: <strong>${item.income.toLocaleString('vi-VN')}đ</strong></p>
            <p><span class="color-box" style="background-color: #EF4444;"></span>Tổng chi tiêu: <strong>${item.expense.toLocaleString('vi-VN')}đ</strong></p>
            <p><i class="fas ${diffIcon} difference-icon ${diffClass}"></i>Chênh lệch: <span class="difference ${diffClass}"><strong>${difference.toLocaleString('vi-VN')}đ</strong></span></p>
        `;
        column.appendChild(monthItem);
    });

    monthlyLegend.appendChild(column); // Chỉ thêm 1 cột vào monthlyLegend
}

  window.fetchTransactions = async function() {
  const transactionDate = document.getElementById('transactionDate').value;
  console.log("Fetching transactions for date: " + transactionDate);
  if (!transactionDate) {
    alert("Vui lòng chọn ngày để xem giao dịch!");
    return;
  }

  try {
    const response = await fetch(`${apiUrl}?action=getTransactionsByDate&date=${transactionDate}&sheetId=${sheetId}`);
    const transactionData = await response.json();
    console.log("Transaction data received: ", transactionData);
    if (transactionData.error) {
      throw new Error(transactionData.error);
    }
    displayTransactions(transactionData);
  } catch (error) {
    console.error("Error fetching transactions: ", error.message);
    alert("Lỗi khi lấy dữ liệu giao dịch: " + error.message);
    displayTransactions({ error: true });
  }
};
    
   function displayTransactions(data) {
  console.log("Dữ liệu nhận được: ", data);
  const container = document.getElementById('transactionsContainer');
  const summaryContainer = document.getElementById('dailySummary');
  container.innerHTML = '';
  if (data.error || !data || data.length === 0) {
    console.log("Không có giao dịch để hiển thị");
    container.innerHTML = '<div>Không có giao dịch trong ngày này</div>';
    summaryContainer.innerHTML = `
      <div class="stat-box income">
        <div class="title">Tổng thu nhập</div>
        <div class="amount no-data">Không có dữ liệu</div>
      </div>
      <div class="stat-box expense">
        <div class="title">Tổng chi tiêu</div>
        <div class="amount no-data">Không có dữ liệu</div>
      </div>
      <div class="stat-box balance">
        <div class="title">Số dư</div>
        <div class="amount no-data">Không có dữ liệu</div>
      </div>
    `;
    return;
  }
  let totalIncome = 0;
  let totalExpense = 0;
  data.forEach(item => {
    if (item.type === 'Thu nhập') {
      totalIncome += item.amount;
    } else if (item.type === 'Chi tiêu') {
      totalExpense += item.amount;
    }
  });
  const balance = totalIncome - totalExpense;
  summaryContainer.innerHTML = `
    <div class="stat-box income">
      <div class="title">Tổng thu nhập</div>
      <div class="amount">${totalIncome.toLocaleString('vi-VN')}đ</div>
    </div>
    <div class="stat-box expense">
      <div class="title">Tổng chi tiêu</div>
      <div class="amount">${totalExpense.toLocaleString('vi-VN')}đ</div>
    </div>
    <div class="stat-box balance">
      <div class="title">Số dư</div>
      <div class="amount">${balance.toLocaleString('vi-VN')}đ</div>
    </div>
  `;
  console.log("Hiển thị giao dịch: ", data.slice(0, 10));
  const limitedData = data.slice(0, 10);
  limitedData.forEach(item => {
    const transactionBox = document.createElement('div');
    transactionBox.className = 'transaction-box';
    const amountColor = item.type === 'Thu nhập' ? '#10B981' : '#EF4444';
    const typeClass = item.type === 'Thu nhập' ? 'income' : 'expense';
    transactionBox.innerHTML = `
  <div style="display: flex; justify-content: space-between; width: 100%;">
    <div style="flex: 1;">
      <div class="date">${item.date}</div>
      <div class="amount" style="color: ${amountColor}">${item.amount.toLocaleString('vi-VN')}đ</div>
      <div class="content">Nội dung: ${item.content}${item.note ? ` (${item.note})` : ''}</div>
    </div>
    <div style="flex: 1; text-align: right;">
      <div class="type ${typeClass}">Phân loại: ${item.type}</div>
      <div class="category">Phân loại chi tiết: ${item.category}</div>
    </div>
  </div>
`;
    container.appendChild(transactionBox);
  });
}

    function getCurrentMonthRange() {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: formatDateToYYYYMMDD(startDate),
        endDate: formatDateToYYYYMMDD(endDate)
      };
    }

    function formatDateToYYYYMMDD(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    document.addEventListener('DOMContentLoaded', function() {
      console.log("Document loaded, initializing...");
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', function() {
          const tabId = this.getAttribute('data-tab');
          window.openTab(tabId);
        });
      });
      const fetchDataBtn = document.getElementById('fetchDataBtn');
      fetchDataBtn.addEventListener('click', window.fetchData);
      const fetchMonthlyDataBtn = document.getElementById('fetchMonthlyDataBtn');
      fetchMonthlyDataBtn.addEventListener('click', window.fetchMonthlyData);
      const fetchTransactionsBtn = document.getElementById('fetchTransactionsBtn');
      fetchTransactionsBtn.addEventListener('click', window.fetchTransactions);
      const { startDate, endDate } = getCurrentMonthRange();
      document.getElementById('startDate').value = startDate;
      document.getElementById('endDate').value = endDate;
      document.getElementById('startMonth').value = 1;
      document.getElementById('endMonth').value = 12;
      document.getElementById('transactionDate').value = formatDateToYYYYMMDD(new Date());
      window.openTab('tab4');
      const qrImage = document.getElementById('qrImage');
      qrImage.src = 'https://i.pinimg.com/736x/7c/13/53/7c135389e26cbc6460626deb9e2aa5c6.jpg';
      qrImage.onerror = function() {
        qrImage.src = 'https://via.placeholder.com/300';
      };
    });
  </script>
