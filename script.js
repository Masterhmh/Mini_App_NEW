// Lấy thông số API và Sheet ID từ URL
const urlParams = new URLSearchParams(window.location.search);
const apiUrl = urlParams.get('api');
const sheetId = urlParams.get('sheetId');

if (!apiUrl || !sheetId) {
  alert("Thiếu thông tin API hoặc Sheet ID. Vui lòng kiểm tra lại URL!");
}

// Biến toàn cục
let cachedFinancialData = null;
let cachedChartData = null;
let cachedTransactions = null;
let currentPage = 1;
const transactionsPerPage = 10;

// Hàm tiện ích
function showError(message, tabId) {
  const errorDiv = document.getElementById(`errorMessage${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
  }
}

function showSuccess(message, tabId) {
  const successDiv = document.getElementById(`successMessage${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 5000);
  }
}

function showModalError(modalId, message) {
  const errorDiv = document.getElementById(`${modalId}Error`);
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
  }
}

function showLoading(show, tabId) {
  const loadingElement = document.getElementById(`loading${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
  if (loadingElement) loadingElement.style.display = show ? 'block' : 'none';
}

function formatDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const [day, month, year] = parts;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateToDDMM(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

// Mở tab
window.openTab = function(tabId) {
  const tabs = document.querySelectorAll('.nav-item');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');
};

// Tab 1: Giao dịch (trước đây là tab4)
window.fetchTransactions = async function() {
  const transactionDate = document.getElementById('transactionDate').value;
  if (!transactionDate) return showError("Vui lòng chọn ngày để xem giao dịch!", 'tab1');
  const dateForApi = transactionDate;
  const [year, month, day] = transactionDate.split('-');
  const formattedDateForDisplay = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  const cacheKey = `${formattedDateForDisplay}`;

  // Reset về trang 1 khi lọc dữ liệu mới
  currentPage = 1;

  if (cachedTransactions && cachedTransactions.cacheKey === cacheKey) {
    displayTransactions(cachedTransactions.data);
    return;
  }

  showLoading(true, 'tab1');
  try {
    const response = await fetch(`${apiUrl}?action=getTransactionsByDate&date=${encodeURIComponent(dateForApi)}&sheetId=${sheetId}`);
    const transactionData = await response.json();
    if (transactionData.error) throw new Error(transactionData.error);
    cachedTransactions = { cacheKey, data: transactionData };
    displayTransactions(transactionData);
  } catch (error) {
    showError("Lỗi khi lấy dữ liệu giao dịch: " + error.message, 'tab1');
    displayTransactions({ error: true });
  } finally {
    showLoading(false, 'tab1');
  }
};

function displayTransactions(data) {
  const container = document.getElementById('transactionsContainer');
  const summaryContainer = document.getElementById('dailySummary');
  const pageInfo = document.getElementById('pageInfo');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  container.innerHTML = '';

  if (data.error || !data || data.length === 0) {
    container.innerHTML = '<div>Không có giao dịch trong ngày này</div>';
    summaryContainer.innerHTML = `
      <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
      <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
      <div class="stat-box balance"><div class="title">Số dư</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
    `;
    pageInfo.textContent = '';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  }

  let totalIncome = 0, totalExpense = 0;
  data.forEach(item => {
    if (item.type === 'Thu nhập') totalIncome += item.amount;
    else if (item.type === 'Chi tiêu') totalExpense += item.amount;
  });
  const balance = totalIncome - totalExpense;
  summaryContainer.innerHTML = `
    <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount">${totalIncome.toLocaleString('vi-VN')}đ</div></div>
    <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount">${totalExpense.toLocaleString('vi-VN')}đ</div></div>
    <div class="stat-box balance"><div class="title">Số dư</div><div class="amount">${balance.toLocaleString('vi-VN')}đ</div></div>
  `;

  const totalPages = Math.ceil(data.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = Math.min(startIndex + transactionsPerPage, data.length); // Đảm bảo không vượt quá số lượng giao dịch
  const paginatedData = data.slice(startIndex, endIndex);

  paginatedData.forEach(item => {
    const transactionBox = document.createElement('div');
    transactionBox.className = 'transaction-box';
    const amountColor = item.type === 'Thu nhập' ? '#10B981' : '#EF4444';
    const typeClass = item.type === 'Thu nhập' ? 'income' : 'expense';
    transactionBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <div style="flex: 1;">
          <div class="date">${formatDate(item.date)}</div>
          <div class="amount" style="color: ${amountColor}">${item.amount.toLocaleString('vi-VN')}đ</div>
          <div class="content">Nội dung: ${item.content}${item.note ? ` (${item.note})` : ''}</div>
        </div>
        <div style="flex: 1; text-align: right;">
          <div class="type ${typeClass}">Phân loại: ${item.type}</div>
          <div class="category">Phân loại chi tiết: ${item.category}</div>
        </div>
      </div>
      <div style="margin-top: 0.5rem;">
        <button class="edit-btn" data-id="${item.id}" style="background: #FFA500; color: white; padding: 0.3rem 0.8rem; border-radius: 8px;">Sửa</button>
        <button class="delete-btn" data-id="${item.id}" style="background: #EF4444; color: white; padding: 0.3rem 0.8rem; border-radius: 8px; margin-left: 0.5rem;">Xóa</button>
      </div>
    `;
    container.appendChild(transactionBox);
  });

  pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage >= totalPages; // Kích hoạt nút "Trang sau" nếu còn trang tiếp theo

  document.querySelectorAll('.edit-btn').forEach(button => {
    const transactionId = button.getAttribute('data-id');
    const transaction = data.find(item => String(item.id) === String(transactionId));
    if (!transaction) return console.error(`Không tìm thấy giao dịch với ID: ${transactionId}`);
    button.addEventListener('click', () => openEditForm(transaction));
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', () => deleteTransaction(button.getAttribute('data-id')));
  });
}

async function fetchCategories() {
  try {
    const response = await fetch(`${apiUrl}?action=getCategories&sheetId=${sheetId}`);
    const categoriesData = await response.json();
    if (categoriesData.error) throw new Error(categoriesData.error);
    return categoriesData;
  } catch (error) {
    showError("Lỗi khi lấy danh sách phân loại: " + error.message, 'tab1');
    return [];
  }
}

async function openEditForm(transaction) {
  if (!transaction) return showError('Dữ liệu giao dịch không hợp lệ!', 'tab1');
  const modal = document.getElementById('editModal');
  const form = document.getElementById('editForm');
  const categorySelect = document.getElementById('editCategory');
  const currentYear = new Date().getFullYear();

  document.getElementById('editTransactionId').value = transaction.id || '';
  document.getElementById('editContent').value = transaction.content || '';
  document.getElementById('editAmount').value = transaction.amount || 0;
  document.getElementById('editType').value = transaction.type || 'Thu nhập';
  document.getElementById('editDate').value = transaction.date ? transaction.date.split('/').slice(0, 2).join('/'): '';
  document.getElementById('editNote').value = transaction.note || '';

  const categories = await fetchCategories();
  categorySelect.innerHTML = '';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    if (category === transaction.category) option.selected = true;
    categorySelect.appendChild(option);
  });

  modal.style.display = 'flex';
  form.onsubmit = async function(e) {
    e.preventDefault();
    const dateInput = document.getElementById('editDate').value;
    if (!/^\d{1,2}\/\d{1,2}$/.test(dateInput)) return showModalError('edit', 'Ngày phải có định dạng dd/MM!');
    const [day, month] = dateInput.split('/').map(Number);
    const today = new Date();
    const inputDate = new Date(currentYear, month - 1, day);
    if (inputDate > today) return showModalError('edit', 'Không thể chọn ngày trong tương lai!');
    if (day < 1 || day > 31 || month < 1 || month > 12) return showModalError('edit', 'Ngày hoặc tháng không hợp lệ!');
    const amount = parseFloat(document.getElementById('editAmount').value);
    if (amount <= 0) return showModalError('edit', 'Số tiền phải lớn hơn 0!');
    const updatedTransaction = {
      id: document.getElementById('editTransactionId').value,
      content: document.getElementById('editContent').value,
      amount: amount,
      type: document.getElementById('editType').value,
      category: document.getElementById('editCategory').value,
      note: document.getElementById('editNote').value || '',
      date: `${dateInput}/${currentYear}`,
      action: 'updateTransaction'
    };
    await saveTransaction(updatedTransaction);
  };
}

async function openAddForm() {
  const modal = document.getElementById('addModal');
  const form = document.getElementById('addForm');
  const categorySelect = document.getElementById('addCategory');
  const currentYear = new Date().getFullYear();

  document.getElementById('addDate').value = formatDateToDDMM(new Date());
  document.getElementById('addContent').value = '';
  document.getElementById('addAmount').value = '';
  document.getElementById('addType').value = 'Thu nhập';
  document.getElementById('addNote').value = '';

  const categories = await fetchCategories();
  categorySelect.innerHTML = '';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });

  modal.style.display = 'flex';
  form.onsubmit = async function(e) {
    e.preventDefault();
    const dateInput = document.getElementById('addDate').value;
    if (!/^\d{1,2}\/\d{1,2}$/.test(dateInput)) return showModalError('add', 'Ngày phải có định dạng dd/MM!');
    const [day, month] = dateInput.split('/').map(Number);
    const today = new Date();
    const inputDate = new Date(currentYear, month - 1, day);
    if (inputDate > today) return showModalError('add', 'Không thể chọn ngày trong tương lai!');
    if (day < 1 || day > 31 || month < 1 || month > 12) return showModalError('add', 'Ngày hoặc tháng không hợp lệ!');
    const amount = parseFloat(document.getElementById('addAmount').value);
    if (amount <= 0) return showModalError('add', 'Số tiền phải lớn hơn 0!');
    const newTransaction = {
      content: document.getElementById('addContent').value,
      amount: amount,
      type: document.getElementById('addType').value,
      category: document.getElementById('addCategory').value,
      note: document.getElementById('addNote').value || '',
      date: `${dateInput}/${currentYear}`,
      action: 'addTransaction'
    };
    await addTransaction(newTransaction);
  };
}

function closeEditForm() { document.getElementById('editModal').style.display = 'none'; }
function closeAddForm() { document.getElementById('addModal').style.display = 'none'; }

async function saveTransaction(updatedTransaction) {
  showLoading(true, 'tab1');
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTransaction)
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    showSuccess("Cập nhật giao dịch thành công!", 'tab1');
    closeEditForm();
    window.fetchTransactions();
  } catch (error) {
    showError("Lỗi khi cập nhật giao dịch: " + error.message, 'tab1');
  } finally {
    showLoading(false, 'tab1');
  }
}

async function addTransaction(newTransaction) {
  showLoading(true, 'tab1');
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTransaction)
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    showSuccess("Thêm giao dịch thành công!", 'tab1');
    closeAddForm();
    window.fetchTransactions();
  } catch (error) {
    showError("Lỗi khi thêm giao dịch: " + error.message, 'tab1');
  } finally {
    showLoading(false, 'tab1');
  }
}

async function deleteTransaction(transactionId) {
  if (!confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;
  showLoading(true, 'tab1');
  try {
    const transaction = cachedTransactions.data.find(item => String(item.id) === String(transactionId));
    if (!transaction) throw new Error("Không tìm thấy giao dịch để xóa!");
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteTransaction', id: transactionId, sheetId: sheetId, date: transaction.date })
    });
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    showSuccess("Xóa giao dịch thành công!", 'tab1');
    window.fetchTransactions();
  } catch (error) {
    showError("Lỗi khi xóa giao dịch: " + error.message, 'tab1');
  } finally {
    showLoading(false, 'tab1');
  }
}

// Tab 2: Thống kê (trước đây là tab1)
window.fetchData = async function() {
  const startDateInput = document.getElementById('startDate').value;
  const endDateInput = document.getElementById('endDate').value;
  if (!startDateInput || !endDateInput) return showError("Vui lòng chọn khoảng thời gian!", 'tab2');
  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);
  if (startDate > endDate) return showError("Ngày bắt đầu không thể lớn hơn ngày kết thúc!", 'tab2');

  const cacheKey = `${startDateInput}-${endDateInput}`;
  if (cachedFinancialData && cachedChartData && cachedFinancialData.cacheKey === cacheKey) {
    updateFinancialData(cachedFinancialData.data);
    updateChartData(cachedChartData.data);
    return;
  }

  showLoading(true, 'tab2');
  try {
    const financialResponse = await fetch(`${apiUrl}?action=getFinancialSummary&startDate=${startDateInput}&endDate=${endDateInput}&sheetId=${sheetId}`);
    const financialData = await financialResponse.json();
    if (financialData.error) throw new Error(financialData.error);
    cachedFinancialData = { cacheKey, data: financialData };
    updateFinancialData(financialData);

    const chartResponse = await fetch(`${apiUrl}?action=getChartData&startDate=${startDateInput}&endDate=${endDateInput}&sheetId=${sheetId}`);
    const chartData = await chartResponse.json();
    if (chartData.error) throw new Error(chartData.error);
    cachedChartData = { cacheKey, data: chartData };
    updateChartData(chartData);
  } catch (error) {
    showError("Lỗi khi lấy dữ liệu: " + error.message, 'tab2');
    updateFinancialData({ error: true });
  } finally {
    showLoading(false, 'tab2');
  }
};

function updateFinancialData(data) {
  const container = document.getElementById('statsContainer');
  if (!data || data.error || (data.income === 0 && data.expense === 0)) {
    container.innerHTML = `
      <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
      <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
      <div class="stat-box balance"><div class="title">Số dư</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
    `;
    return;
  }
  const totalIncome = Number(data.income) || 0;
  const totalExpense = Number(data.expense) || 0;
  const balance = totalIncome - totalExpense;
  container.innerHTML = `
    <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount">${totalIncome.toLocaleString('vi-VN')}đ</div></div>
    <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount">${totalExpense.toLocaleString('vi-VN')}đ</div></div>
    <div class="stat-box balance"><div class="title">Số dư</div><div class="amount">${balance.toLocaleString('vi-VN')}đ</div></div>
  `;
}

function updateChartData(response) {
  if (response.error) {
    showError(response.error, 'tab2');
    if (window.myChart) window.myChart.destroy();
    return;
  }
  const chartData = response.chartData;
  const categories = response.categories;
  const ctx = document.getElementById('myChart').getContext('2d');
  if (window.myChart) window.myChart.destroy();
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
    if (i % 2 === 0) leftColumn.appendChild(legendItem);
    else rightColumn.appendChild(legendItem);
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

// Tab 3: Biểu đồ (trước đây là tab2)
window.fetchMonthlyData = async function() {
  const startMonth = parseInt(document.getElementById('startMonth').value);
  const endMonth = parseInt(document.getElementById('endMonth').value);
  const year = new Date().getFullYear();
  if (startMonth > endMonth) return alert("Tháng bắt đầu không thể lớn hơn tháng kết thúc!");

  showLoading(true, 'tab3');
  try {
    const response = await fetch(`${apiUrl}?action=getMonthlyData&year=${year}&sheetId=${sheetId}`);
    const monthlyData = await response.json();
    if (monthlyData.error) throw new Error(monthlyData.error);

    const fullYearData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const existingData = monthlyData.find(item => item.month === month);
      return existingData || { month, income: 0, expense: 0 };
    });

    const filteredData = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => {
      const month = startMonth + i;
      const existingData = fullYearData.find(item => item.month === month);
      return existingData || { month, income: 0, expense: 0 };
    });

    updateMonthlyChart(filteredData);
  } catch (error) {
    showError("Lỗi khi lấy dữ liệu biểu đồ tháng: " + error.message, 'tab3');
    const filteredData = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => ({
      month: startMonth + i,
      income: 0,
      expense: 0
    }));
    updateMonthlyChart(filteredData);
  } finally {
    showLoading(false, 'tab3');
  }
};

function updateMonthlyChart(filteredData) {
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  if (window.monthlyChart) window.monthlyChart.destroy();

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
          y: { beginAtZero: true, title: { display: true, text: 'Số tiền (đ)', font: { size: 14 } }, ticks: { font: { size: 12 } } },
          x: { title: { display: true, text: 'Tháng', font: { size: 14 } }, ticks: { font: { size: 12 } } }
        },
        plugins: {
          legend: { display: true, labels: { font: { size: 12 } } },
          tooltip: {
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            callbacks: { label: tooltipItem => `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString('vi-VN')}đ` }
          },
          datalabels: { display: false }
        }
      }
    });
    document.getElementById('monthlyLegend').innerHTML = '<div>Không có dữ liệu</div>';
    return;
  }

  const labels = filteredData.map(item => `Tháng ${item.month}`);
  const incomes = filteredData.map(item => item.income || 0);
  const expenses = filteredData.map(item => item.expense || 0);

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
          ticks: { callback: value => value.toLocaleString('vi-VN') + 'đ', font: { size: 12 } }
        },
        x: {
          title: { display: true, text: 'Tháng', font: { size: 14 } },
          ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45, autoSkip: false }
        }
      },
      plugins: {
        legend: { display: true, labels: { font: { size: 12 } } },
        tooltip: {
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
          callbacks: { label: tooltipItem => `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString('vi-VN')}đ` }
        },
        datalabels: {
          display: true,
          align: 'end',
          anchor: 'end',
          formatter: value => value.toLocaleString('vi-VN') + 'đ',
          color: '#1F2A44',
          font: { weight: 'bold', size: 12 }
        }
      }
    }
  });

  const monthlyLegend = document.getElementById('monthlyLegend');
  monthlyLegend.innerHTML = '';
  const column = document.createElement('div');
  column.className = 'monthly-column';

  filteredData.forEach(item => {
    const difference = (item.income || 0) - (item.expense || 0);
    const diffClass = difference >= 0 ? 'positive' : 'negative';
    const diffIcon = difference >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    const monthItem = document.createElement('div');
    monthItem.className = 'month-item';
    monthItem.innerHTML = `
      <h3>Tháng ${item.month}:</h3>
      <p><span class="color-box" style="background-color: #10B981;"></span>Tổng thu nhập: <strong>${(item.income || 0).toLocaleString('vi-VN')}đ</strong></p>
      <p><span class="color-box" style="background-color: #EF4444;"></span>Tổng chi tiêu: <strong>${(item.expense || 0).toLocaleString('vi-VN')}đ</strong></p>
      <p><i class="fas ${diffIcon} difference-icon ${diffClass}"></i>Chênh lệch: <span class="difference ${diffClass}"><strong>${difference.toLocaleString('vi-VN')}đ</strong></span></p>
    `;
    column.appendChild(monthItem);
  });

  monthlyLegend.appendChild(column);
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', function() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => window.openTab(item.getAttribute('data-tab')));
  });

  document.getElementById('fetchDataBtn').addEventListener('click', window.fetchData);
  document.getElementById('fetchMonthlyDataBtn').addEventListener('click', window.fetchMonthlyData);
  document.getElementById('fetchTransactionsBtn').addEventListener('click', window.fetchTransactions);
  document.getElementById('addTransactionBtn').addEventListener('click', openAddForm);

  document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    window.fetchTransactions();
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  const totalPages = Math.ceil((cachedTransactions?.data.length || 0) / transactionsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    window.fetchTransactions();
  }
});

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  document.getElementById('startDate').value = formatDateToYYYYMMDD(startDate);
  document.getElementById('endDate').value = formatDateToYYYYMMDD(today);
  document.getElementById('startMonth').value = 1;
  document.getElementById('endMonth').value = 12;
  document.getElementById('transactionDate').value = formatDateToYYYYMMDD(today);

  window.openTab('tab1');
});
