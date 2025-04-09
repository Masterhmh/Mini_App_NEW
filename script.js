// Lấy thông số API và Sheet ID từ URL
const urlParams = new URLSearchParams(window.location.search);
const apiUrl = urlParams.get('api');
const sheetId = urlParams.get('sheetId');

if (!apiUrl || !sheetId) {
  showToast("Thiếu thông tin API hoặc Sheet ID. Vui lòng kiểm tra lại URL!", "error");
}

// Biến toàn cục
let cachedFinancialData = null;
let cachedChartData = null;
let cachedTransactions = null;
let currentPage = 1;
const transactionsPerPage = 10;
let cachedMonthlyExpenses = null;
let currentPageMonthly = 1;
const expensesPerPage = 10;
let cachedSearchResults = null;
let currentPageSearch = 1;
const searchPerPage = 10;

// Hàm hiển thị Toast
function showToast(message, type = "info") {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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

// Tab 1: Giao dịch
window.fetchTransactions = async function() {
  const transactionDate = document.getElementById('transactionDate').value;
  if (!transactionDate) return showToast("Vui lòng chọn ngày để xem giao dịch!", "warning");
  const dateForApi = transactionDate;
  const [year, month, day] = transactionDate.split('-');
  const formattedDateForDisplay = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  const cacheKey = `${formattedDateForDisplay}`;

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
    showToast("Lỗi khi lấy dữ liệu giao dịch: " + error.message, "error");
    displayTransactions({ error: true });
  } finally {
    showLoading(false, 'tab1');
  }
};

function displayTransactions(data) {
  const container = document.getElementById('transactionsContainer');
  const pageInfo = document.getElementById('pageInfo');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  container.innerHTML = '';

  if (!data || data.error || !Array.isArray(data) || data.length === 0) {
    container.innerHTML = '<div>Không có giao dịch nào trong ngày này</div>';
    pageInfo.textContent = '';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  }

  const totalPages = Math.ceil(data.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  paginatedData.forEach((item, index) => {
    const transactionBox = document.createElement('div');
    transactionBox.className = 'transaction-box';
    const amountColor = item.type === 'Thu nhập' ? '#10B981' : '#EF4444';
    const typeClass = item.type === 'Thu nhập' ? 'income' : 'expense';
    const transactionNumber = startIndex + index + 1;
    transactionBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <div style="flex: 1;">
          <div class="date">${formatDate(item.date)}</div>
          <div class="amount" style="color: ${amountColor}">${item.amount.toLocaleString('vi-VN')}đ</div>
          <div class="content">Nội dung: ${item.content}${item.note ? ` (${item.note})` : ''}</div>
          <div class="number">STT của giao dịch: ${transactionNumber}</div>
          <div class="id">ID của giao dịch: ${item.id}</div>
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
  nextPageBtn.disabled = currentPage === totalPages;

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
    showToast("Lỗi khi lấy danh sách phân loại: " + error.message, "error");
    return [];
  }
}

async function openEditForm(transaction) {
  if (!transaction) return showToast('Dữ liệu giao dịch không hợp lệ!', "error");
  const modal = document.getElementById('editModal');
  const form = document.getElementById('editForm');
  const categorySelect = document.getElementById('editCategory');
  const currentYear = new Date().getFullYear();

  document.getElementById('editTransactionId').value = transaction.id || '';
  document.getElementById('editContent').value = transaction.content || '';
  document.getElementById('editAmount').value = transaction.amount || 0;
  document.getElementById('editType').value = transaction.type || 'Thu nhập';
  document.getElementById('editDate').value = transaction.date ? transaction.date.split('/').slice(0, 2).join('/') : '';
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
    showToast("Cập nhật giao dịch thành công!", "success");
    closeEditForm();
    window.fetchTransactions();
  } catch (error) {
    showToast("Lỗi khi cập nhật giao dịch: " + error.message, "error");
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
    showToast("Thêm giao dịch thành công!", "success");
    closeAddForm();
    window.fetchTransactions();
  } catch (error) {
    showToast("Lỗi khi thêm giao dịch: " + error.message, "error");
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
    showToast("Xóa giao dịch thành công!", "success");
    window.fetchTransactions();
  } catch (error) {
    showToast("Lỗi khi xóa giao dịch: " + error.message, "error");
  } finally {
    showLoading(false, 'tab1');
  }
}

// Tab 2: Liệt kê
window.fetchMonthlyExpenses = async function() {
  const month = document.getElementById('expenseMonth').value;
  if (!month) return showToast("Vui lòng chọn tháng để xem giao dịch!", "warning");
  const year = new Date().getFullYear();
  const cacheKey = `${year}-${month}`;

  if (cachedMonthlyExpenses && cachedMonthlyExpenses.cacheKey === cacheKey) {
    displayMonthlyExpenses(cachedMonthlyExpenses.data);
    return;
  }

  showLoading(true, 'tab2');
  try {
    const response = await fetch(`${apiUrl}?action=getTransactionsByMonth&month=${month}&year=${year}&sheetId=${sheetId}`);
    const transactionData = await response.json();
    if (transactionData.error) throw new Error(transactionData.error);
    cachedMonthlyExpenses = { cacheKey, data: transactionData };
    displayMonthlyExpenses(transactionData);
  } catch (error) {
    showToast("Lỗi khi lấy dữ liệu giao dịch: " + error.message, "error");
    displayMonthlyExpenses({ error: true });
  } finally {
    showLoading(false, 'tab2');
  }
};

function displayMonthlyExpenses(data) {
  const container = document.getElementById('monthlyExpensesContainer');
  const summaryContainer = document.getElementById('monthlyExpenseSummary');
  const pageInfo = document.getElementById('pageInfoMonthly');
  const prevPageBtn = document.getElementById('prevPageMonthly');
  const nextPageBtn = document.getElementById('nextPageMonthly');
  container.innerHTML = '';

  if (!data || data.error || !Array.isArray(data) || data.length === 0) {
    container.innerHTML = '<div>Không có giao dịch trong tháng này</div>';
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

  const totalTransactions = data.length;
  container.innerHTML = `<div class="notification">Bạn có ${totalTransactions} giao dịch trong tháng</div>`;

  const totalPages = Math.ceil(data.length / expensesPerPage);
  const startIndex = (currentPageMonthly - 1) * expensesPerPage;
  const endIndex = startIndex + expensesPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  paginatedData.forEach((item, index) => {
    const transactionBox = document.createElement('div');
    transactionBox.className = 'transaction-box';
    const amountColor = item.type === 'Thu nhập' ? '#10B981' : '#EF4444';
    const typeClass = item.type === 'Thu nhập' ? 'income' : 'expense';
    const transactionNumber = startIndex + index + 1;
    transactionBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <div style="flex: 1;">
          <div class="date">${formatDate(item.date)}</div>
          <div class="amount" style="color: ${amountColor}">${item.amount.toLocaleString('vi-VN')}đ</div>
          <div class="content">Nội dung: ${item.content}${item.note ? ` (${item.note})` : ''}</div>
          <div class="number">STT của giao dịch: ${transactionNumber}</div>
          <div class="id">ID của giao dịch: ${item.id}</div>
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

  pageInfo.textContent = `Trang ${currentPageMonthly} / ${totalPages}`;
  prevPageBtn.disabled = currentPageMonthly === 1;
  nextPageBtn.disabled = currentPageMonthly === totalPages;

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

// Tab 3: Thống kê
window.fetchData = async function() {
  const startDateInput = document.getElementById('startDate').value;
  const endDateInput = document.getElementById('endDate').value;
  if (!startDateInput || !endDateInput) {
    showToast("Vui lòng chọn khoảng thời gian!", "warning");
    return;
  }
  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);
  if (startDate > endDate) {
    showToast("Ngày bắt đầu không thể lớn hơn ngày kết thúc!", "warning");
    return;
  }

  showLoading(true, 'tab3');
  try {
    const financialResponse = await fetch(`${apiUrl}?action=getFinancialSummary&startDate=${startDateInput}&endDate=${endDateInput}&sheetId=${sheetId}`);
    if (!financialResponse.ok) throw new Error(`HTTP error! Status: ${financialResponse.status}`);
    const financialData = await financialResponse.json();
    if (financialData.error) throw new Error(financialData.error);
    updateFinancialData(financialData);

    const chartResponse = await fetch(`${apiUrl}?action=getChartData&startDate=${startDateInput}&endDate=${endDateInput}&sheetId=${sheetId}`);
    if (!chartResponse.ok) throw new Error(`HTTP error! Status: ${chartResponse.status}`);
    const chartData = await chartResponse.json();
    if (chartData.error) throw new Error(chartData.error);
    updateChartData(chartData);
  } catch (error) {
    showToast("Lỗi khi lấy dữ liệu: " + error.message, "error");
    updateFinancialData({ error: true });
  } finally {
    showLoading(false, 'tab3');
  }
};

function updateFinancialData(data) {
  const container = document.getElementById('statsContainer');
  if (!data || data.error) {
    container.innerHTML = `
      <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
      <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
      <div class="stat-box balance"><div class="title">Số dư</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
    `;
    return;
  }

  const totalIncome = data.totalIncome || 0;
  const totalExpense = data.totalExpense || 0;
  const balance = totalIncome - totalExpense;

  container.innerHTML = `
    <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount">${totalIncome.toLocaleString('vi-VN')}đ</div></div>
    <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount">${totalExpense.toLocaleString('vi-VN')}đ</div></div>
    <div class="stat-box balance"><div class="title">Số dư</div><div class="amount">${balance.toLocaleString('vi-VN')}đ</div></div>
  `;
}

function updateChartData(data) {
  const ctx = document.getElementById('myChart').getContext('2d');
  const customLegend = document.getElementById('customLegend');

  if (!data || data.error || !data.categories || Object.keys(data.categories).length === 0) {
    if (window.myChart) window.myChart.destroy();
    ctx.canvas.style.display = 'none';
    customLegend.innerHTML = '<div>Không có dữ liệu chi tiêu để hiển thị</div>';
    return;
  }

  ctx.canvas.style.display = 'block';
  const categories = data.categories;
  const labels = Object.keys(categories);
  const amounts = Object.values(categories);
  const totalExpense = amounts.reduce((sum, amount) => sum + amount, 0);

  const chartData = {
    labels: labels,
    datasets: [{
      data: amounts,
      backgroundColor: [
        '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
        '#EC4899', '#6B7280', '#F97316', '#14B8A6', '#D946EF'
      ],
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const percentage = ((value / totalExpense) * 100).toFixed(1);
            return `${context.label}: ${value.toLocaleString('vi-VN')}đ (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#FFFFFF',
        font: { weight: 'bold', size: 12 },
        formatter: (value, context) => {
          const percentage = ((value / totalExpense) * 100).toFixed(1);
          return value > 0 ? `${percentage}%` : '';
        },
        anchor: 'center',
        align: 'center'
      }
    }
  };

  if (window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type: 'pie',
    data: chartData,
    options: options,
    plugins: [ChartDataLabels]
  });

  customLegend.innerHTML = '';
  const columnCount = Math.ceil(labels.length / 2);
  const leftColumn = document.createElement('div');
  leftColumn.className = 'custom-legend-column';
  const rightColumn = document.createElement('div');
  rightColumn.className = 'custom-legend-column';

  labels.forEach((label, index) => {
    const value = amounts[index];
    const percentage = ((value / totalExpense) * 100).toFixed(1);
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-color" style="background-color: ${chartData.datasets[0].backgroundColor[index]};"></div>
      <div class="legend-text">${label}<span class="legend-value">${value.toLocaleString('vi-VN')}đ (${percentage}%)</span></div>
    `;
    if (index < columnCount) leftColumn.appendChild(legendItem);
    else rightColumn.appendChild(legendItem);
  });

  customLegend.appendChild(leftColumn);
  customLegend.appendChild(rightColumn);
}

// Tab 4: Biểu đồ
window.fetchMonthlyData = async function() {
  const startMonth = parseInt(document.getElementById('startMonth').value);
  const endMonth = parseInt(document.getElementById('endMonth').value);
  const year = new Date().getFullYear();
  if (startMonth > endMonth) {
    showToast("Tháng bắt đầu không thể lớn hơn tháng kết thúc!", "warning");
    return;
  }

  showLoading(true, 'tab4');
  try {
    const response = await fetch(`${apiUrl}?action=getMonthlyData&year=${year}&sheetId=${sheetId}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
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
    showToast("Lỗi khi lấy dữ liệu biểu đồ tháng: " + error.message, "error");
    const filteredData = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => ({
      month: startMonth + i,
      income: 0,
      expense: 0
    }));
    updateMonthlyChart(filteredData);
  } finally {
    showLoading(false, 'tab4');
  }
};

function updateMonthlyChart(data) {
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  const monthlyLegend = document.getElementById('monthlyLegend');

  const labels = data.map(item => `Tháng ${item.month}`);
  const incomes = data.map(item => item.income);
  const expenses = data.map(item => item.expense);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Thu nhập',
        data: incomes,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        barThickness: 20,
      },
      {
        label: 'Chi tiêu',
        data: expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        barThickness: 20,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('vi-VN') + 'đ';
          }
        }
      },
      x: { stacked: false }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw.toLocaleString('vi-VN')}đ`;
          }
        }
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#000',
        font: { weight: 'bold', size: 12 },
        formatter: (value) => value > 0 ? value.toLocaleString('vi-VN') : ''
      }
    }
  };

  if (window.monthlyChart) window.monthlyChart.destroy();
  window.monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: options,
    plugins: [ChartDataLabels]
  });

  monthlyLegend.innerHTML = '';
  const monthlyColumn = document.createElement('div');
  monthlyColumn.className = 'monthly-column';

  data.forEach(item => {
    const difference = item.income - item.expense;
    const monthItem = document.createElement('div');
    monthItem.className = 'month-item';
    monthItem.innerHTML = `
      <h3>Tháng ${item.month}</h3>
      <p><span class="color-box" style="background-color: rgba(16, 185, 129, 0.8);"></span>Thu nhập: <span class="amount">${item.income.toLocaleString('vi-VN')}đ</span></p>
      <p><span class="color-box" style="background-color: rgba(239, 68, 68, 0.8);"></span>Chi tiêu: <span class="amount">${item.expense.toLocaleString('vi-VN')}đ</span></p>
      <p>Số dư: <span class="difference ${difference >= 0 ? 'positive' : 'negative'}">${difference >= 0 ? '+' : ''}${difference.toLocaleString('vi-VN')}đ</span></p>
    `;
    monthlyColumn.appendChild(monthItem);
  });

  monthlyLegend.appendChild(monthlyColumn);
}

// Tab 5: Tìm kiếm
window.searchTransactions = async function() {
  const month = document.getElementById('searchMonth').value;
  const content = document.getElementById('searchContent').value.trim();
  const amount = document.getElementById('searchAmount').value;
  const category = document.getElementById('searchCategory').value;
  const year = new Date().getFullYear();

  if (!content && !amount && !category) {
    return showToast("Vui lòng nhập ít nhất một tiêu chí: nội dung, số tiền, hoặc phân loại chi tiết!", "warning");
  }

  showLoading(true, 'tab5');
  try {
    let url = `${apiUrl}?action=searchTransactions&sheetId=${sheetId}`;
    if (month) url += `&month=${month}&year=${year}`;
    if (content) url += `&content=${encodeURIComponent(content)}`;
    if (amount) url += `&amount=${encodeURIComponent(amount)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    const response = await fetch(url);
    const searchData = await response.json();
    if (searchData.error) throw new Error(searchData.error);

    cachedSearchResults = searchData;
    currentPageSearch = 1;
    displaySearchResults(searchData);
  } catch (error) {
    showToast("Lỗi khi tìm kiếm giao dịch: " + error.message, "error");
    displaySearchResults({ error: true });
  } finally {
    showLoading(false, 'tab5');
  }
};

function displaySearchResults(data) {
  const container = document.getElementById('searchResultsContainer');
  const pageInfo = document.getElementById('pageInfoSearch');
  const prevPageBtn = document.getElementById('prevPageSearch');
  const nextPageBtn = document.getElementById('nextPageSearch');
  container.innerHTML = '';

  if (!data || data.error || !Array.isArray(data) || data.length === 0) {
    container.innerHTML = '<div>Không tìm thấy giao dịch nào phù hợp</div>';
    pageInfo.textContent = '';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  }

  const totalPages = Math.ceil(data.length / searchPerPage);
  const startIndex = (currentPageSearch - 1) * searchPerPage;
  const endIndex = startIndex + searchPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  paginatedData.forEach((item, index) => {
    const transactionBox = document.createElement('div');
    transactionBox.className = 'transaction-box';
    const amountColor = item.type === 'Thu nhập' ? '#10B981' : '#EF4444';
    const typeClass = item.type === 'Thu nhập' ? 'income' : 'expense';
    const transactionNumber = startIndex + index + 1;
    transactionBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <div style="flex: 1;">
          <div class="date">${formatDate(item.date)}</div>
          <div class="amount" style="color: ${amountColor}">${item.amount.toLocaleString('vi-VN')}đ</div>
          <div class="content">Nội dung: ${item.content}${item.note ? ` (${item.note})` : ''}</div>
          <div class="number">STT của giao dịch: ${transactionNumber}</div>
          <div class="id">ID của giao dịch: ${item.id}</div>
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

  pageInfo.textContent = `Trang ${currentPageSearch} / ${totalPages}`;
  prevPageBtn.disabled = currentPageSearch === 1;
  nextPageBtn.disabled = currentPageSearch === totalPages;

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

async function populateSearchCategories() {
  const categories = await fetchCategories();
  const searchCategorySelect = document.getElementById('searchCategory');
  searchCategorySelect.innerHTML = '<option value="">Tất cả</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    searchCategorySelect.appendChild(option);
  });
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', function() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => window.openTab(item.getAttribute('data-tab')));
  });

  document.getElementById('fetchTransactionsBtn').addEventListener('click', window.fetchTransactions); // Tab 1
  document.getElementById('fetchMonthlyExpensesBtn').addEventListener('click', window.fetchMonthlyExpenses); // Tab 2
  document.getElementById('fetchDataBtn').addEventListener('click', window.fetchData); // Tab 3
  document.getElementById('fetchMonthlyDataBtn').addEventListener('click', window.fetchMonthlyData); // Tab 4
  document.getElementById('searchTransactionsBtn').addEventListener('click', window.searchTransactions); // Tab 5
  document.getElementById('addTransactionBtn').addEventListener('click', openAddForm);

  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayTransactions(cachedTransactions.data);
    }
  });
  document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil((cachedTransactions?.data.length || 0) / transactionsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      displayTransactions(cachedTransactions.data);
    }
  });

  document.getElementById('prevPageMonthly').addEventListener('click', () => {
    if (currentPageMonthly > 1) {
      currentPageMonthly--;
      displayMonthlyExpenses(cachedMonthlyExpenses.data);
    }
  });
  document.getElementById('nextPageMonthly').addEventListener('click', () => {
    const totalPages = Math.ceil((cachedMonthlyExpenses?.data.length || 0) / expensesPerPage);
    if (currentPageMonthly < totalPages) {
      currentPageMonthly++;
      displayMonthlyExpenses(cachedMonthlyExpenses.data);
    }
  });

  document.getElementById('prevPageSearch').addEventListener('click', () => {
    if (currentPageSearch > 1) {
      currentPageSearch--;
      displaySearchResults(cachedSearchResults);
    }
  });
  document.getElementById('nextPageSearch').addEventListener('click', () => {
    const totalPages = Math.ceil((cachedSearchResults?.length || 0) / searchPerPage);
    if (currentPageSearch < totalPages) {
      currentPageSearch++;
      displaySearchResults(cachedSearchResults);
    }
  });

  const today = new Date();
  const formattedToday = formatDateToYYYYMMDD(today);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const formattedFirstDay = formatDateToYYYYMMDD(firstDayOfMonth);

  const transactionDateInput = document.getElementById('transactionDate');
  if (transactionDateInput) transactionDateInput.value = formattedToday;

  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  if (startDateInput && endDateInput) {
    startDateInput.value = formattedFirstDay;
    endDateInput.value = formattedToday;
  }

  const currentMonth = today.getMonth() + 1;
  document.getElementById('expenseMonth').value = currentMonth;
  document.getElementById('startMonth').value = currentMonth;
  document.getElementById('endMonth').value = currentMonth;

  populateSearchCategories();
  window.openTab('tab1'); // Mặc định mở tab Giao dịch
});
