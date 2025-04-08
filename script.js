// Biến toàn cục để quản lý trạng thái phân trang
const paginationState = {
  tab1: { currentPage: 1, itemsPerPage: 10, cachedData: null }, // Tab 1: Giao dịch
  tab5: { currentPage: 1, itemsPerPage: 10, cachedData: null }, // Tab 5: Chi tiêu trong tháng
  tab6: { currentPage: 1, itemsPerPage: 10, cachedData: null }  // Tab 6: Tìm kiếm giao dịch
};

// Hàm chung để hiển thị danh sách giao dịch
function displayTransactionsGeneric({
  data, // Dữ liệu giao dịch (mảng)
  tabId, // ID của tab (ví dụ: 'tab1', 'tab5', 'tab6')
  containerId, // ID của container hiển thị (ví dụ: 'searchResultsContainer')
  pageInfoId, // ID của phần tử hiển thị thông tin trang (ví dụ: 'pageInfoSearch')
  prevPageId, // ID của nút "Trang trước" (ví dụ: 'prevPageSearch')
  nextPageId, // ID của nút "Trang sau" (ví dụ: 'nextPageSearch')
  noDataMessage, // Thông báo khi không có dữ liệu
  updateSummaryCallback // Hàm callback để cập nhật tóm tắt (dùng cho tab 5, nếu có)
}) {
  const container = document.getElementById(containerId);
  const pageInfo = document.getElementById(pageInfoId);
  const prevPageBtn = document.getElementById(prevPageId);
  const nextPageBtn = document.getElementById(nextPageId);

  // Lấy trạng thái phân trang từ paginationState
  const { currentPage, itemsPerPage } = paginationState[tabId];

  container.innerHTML = '';

  // Kiểm tra dữ liệu
  if (!data || data.error || !Array.isArray(data) || data.length === 0) {
    container.innerHTML = `<div>${noDataMessage}</div>`;
    pageInfo.textContent = '';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;

    // Nếu có callback cập nhật tóm tắt (dùng cho tab 5), gọi nó
    if (updateSummaryCallback) {
      updateSummaryCallback(null);
    }
    return;
  }

  // Hiển thị thông báo số lượng giao dịch
  let notificationMessage = '';
  if (tabId === 'tab1') {
    notificationMessage = `Bạn có ${data.length} giao dịch trong ngày`;
  } else if (tabId === 'tab5') {
    notificationMessage = `Bạn có ${data.length} giao dịch trong tháng`;
  } else if (tabId === 'tab6') {
    notificationMessage = `Tìm thấy ${data.length} giao dịch phù hợp`;
  }
  container.innerHTML = `<div class="notification">${notificationMessage}</div>`;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  // Hiển thị danh sách giao dịch
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
          <div class="type ${typeClass}">Phân loại: ${item.type}</div>
          <div class="category">Phân loại chi tiết: ${item.category}</div>
        </div>
        <div style="flex: 1; text-align: right;">
          <div class="number">Giao dịch thứ: ${transactionNumber}</div>
          <div class="id">ID của giao dịch: ${item.id}</div>
        </div>
      </div>
      <div style="margin-top: 0.5rem;">
        <button class="edit-btn" data-id="${item.id}" style="background: #FFA500; color: white; padding: 0.3rem 0.8rem; border-radius: 8px;">Sửa</button>
        <button class="delete-btn" data-id="${item.id}" style="background: #EF4444; color: white; padding: 0.3rem 0.8rem; border-radius: 8px; margin-left: 0.5rem;">Xóa</button>
      </div>
    `;
    container.appendChild(transactionBox);
  });

  // Cập nhật thông tin phân trang
  pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;

  // Gắn sự kiện cho nút "Sửa"
  document.querySelectorAll('.edit-btn').forEach(button => {
    const transactionId = button.getAttribute('data-id');
    const transaction = data.find(item => String(item.id) === String(transactionId));
    if (!transaction) return console.error(`Không tìm thấy giao dịch với ID: ${transactionId}`);
    button.addEventListener('click', () => openEditForm(transaction));
  });

  // Gắn sự kiện cho nút "Xóa"
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', () => deleteTransaction(button.getAttribute('data-id')));
  });

  // Nếu có callback cập nhật tóm tắt (dùng cho tab 5), gọi nó
  if (updateSummaryCallback) {
    let totalIncome = 0, totalExpense = 0;
    data.forEach(item => {
      if (item.type === 'Thu nhập') totalIncome += item.amount;
      else if (item.type === 'Chi tiêu') totalExpense += item.amount;
    });
    const balance = totalIncome - totalExpense;
    updateSummaryCallback({ income: totalIncome, expense: totalExpense, balance });
  }
}

// Hàm hiển thị cho tab 1 (Giao dịch)
function displayTransactions(data) {
  paginationState.tab1.cachedData = { data }; // Lưu dữ liệu vào cache
  displayTransactionsGeneric({
    data,
    tabId: 'tab1',
    containerId: 'transactionsContainer',
    pageInfoId: 'pageInfo',
    prevPageId: 'prevPage',
    nextPageId: 'nextPage',
    noDataMessage: 'Không có giao dịch nào trong ngày này'
  });
}

// Hàm hiển thị cho tab 5 (Chi tiêu trong tháng)
function displayMonthlyExpenses(data) {
  paginationState.tab5.cachedData = { data }; // Lưu dữ liệu vào cache
  displayTransactionsGeneric({
    data,
    tabId: 'tab5',
    containerId: 'monthlyExpensesContainer',
    pageInfoId: 'pageInfoMonthly',
    prevPageId: 'prevPageMonthly',
    nextPageId: 'nextPageMonthly',
    noDataMessage: 'Không có giao dịch trong tháng này',
    updateSummaryCallback: (summaryData) => {
      const summaryContainer = document.getElementById('monthlyExpenseSummary');
      if (!summaryData) {
        summaryContainer.innerHTML = `
          <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
          <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
          <div class="stat-box balance"><div class="title">Số dư</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
        `;
      } else {
        summaryContainer.innerHTML = `
          <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount">${summaryData.income.toLocaleString('vi-VN')}đ</div></div>
          <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount">${summaryData.expense.toLocaleString('vi-VN')}đ</div></div>
          <div class="stat-box balance"><div class="title">Số dư</div><div class="amount">${summaryData.balance.toLocaleString('vi-VN')}đ</div></div>
        `;
      }
    }
  });
}

// Hàm hiển thị cho tab 6 (Tìm kiếm giao dịch)
function displaySearchResults(data) {
  paginationState.tab6.cachedData = { data }; // Lưu dữ liệu vào cache
  displayTransactionsGeneric({
    data,
    tabId: 'tab6',
    containerId: 'searchResultsContainer',
    pageInfoId: 'pageInfoSearch',
    prevPageId: 'prevPageSearch',
    nextPageId: 'nextPageSearch',
    noDataMessage: 'Không tìm thấy giao dịch nào phù hợp'
  });
}

// Hàm định dạng ngày
function formatDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${day}/${month}/${year}`;
}

// Hàm định dạng ngày thành YYYY-MM-DD
function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Hàm hiển thị thông báo lỗi
function showError(message, tabId) {
  const errorContainer = document.getElementById(`error-${tabId}`);
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';
  setTimeout(() => {
    errorContainer.style.display = 'none';
  }, 3000);
}

// Hàm hiển thị loading
function showLoading(show, tabId) {
  const loading = document.getElementById(`loading-${tabId}`);
  loading.style.display = show ? 'block' : 'none';
}

// Hàm mở tab
window.openTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.getElementById(tabId).style.display = 'block';
  document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');
};

// Hàm lấy dữ liệu giao dịch trong khoảng thời gian
window.fetchTransactions = async function() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  if (!startDate || !endDate) {
    return showError('Vui lòng chọn ngày bắt đầu và ngày kết thúc!', 'tab1');
  }

  showLoading(true, 'tab1');
  try {
    const url = `${apiUrl}?action=getTransactions&sheetId=${sheetId}&startDate=${startDate}&endDate=${endDate}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    paginationState.tab1.currentPage = 1; // Reset về trang đầu tiên
    displayTransactions(data.transactions);
  } catch (error) {
    showError('Lỗi khi lấy dữ liệu giao dịch: ' + error.message, 'tab1');
    displayTransactions({ error: true });
  } finally {
    showLoading(false, 'tab1');
  }
};

// Hàm lấy chi tiêu trong tháng
window.fetchMonthlyExpenses = async function() {
  const month = document.getElementById('expenseMonth').value;
  const year = new Date().getFullYear();
  if (!month) {
    return showError('Vui lòng chọn tháng!', 'tab5');
  }

  showLoading(true, 'tab5');
  try {
    const url = `${apiUrl}?action=getMonthlyExpenses&sheetId=${sheetId}&month=${month}&year=${year}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    paginationState.tab5.currentPage = 1; // Reset về trang đầu tiên
    displayMonthlyExpenses(data.transactions);
  } catch (error) {
    showError('Lỗi khi lấy dữ liệu chi tiêu: ' + error.message, 'tab5');
    displayMonthlyExpenses({ error: true });
  } finally {
    showLoading(false, 'tab5');
  }
};

// Hàm tìm kiếm giao dịch
window.searchTransactions = async function() {
  const month = document.getElementById('searchMonth').value;
  const content = document.getElementById('searchContent').value.trim();
  const amount = document.getElementById('searchAmount').value;
  const category = document.getElementById('searchCategory').value;
  const year = new Date().getFullYear();

  if (!content && !amount && !category) {
    return showError("Vui lòng nhập ít nhất một tiêu chí: nội dung, số tiền, hoặc phân loại chi tiết!", 'tab6');
  }

  showLoading(true, 'tab6');
  try {
    let url = `${apiUrl}?action=searchTransactions&sheetId=${sheetId}`;
    if (month) url += `&month=${month}&year=${year}`;
    if (content) url += `&content=${encodeURIComponent(content)}`;
    if (amount) url += `&amount=${encodeURIComponent(amount)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    const response = await fetch(url);
    const searchData = await response.json();
    if (searchData.error) throw new Error(searchData.error);

    paginationState.tab6.currentPage = 1; // Reset về trang đầu tiên
    displaySearchResults(searchData.transactions);
  } catch (error) {
    showError("Lỗi khi tìm kiếm giao dịch: " + error.message, 'tab6');
    displaySearchResults({ error: true });
  } finally {
    showLoading(false, 'tab6');
  }
};

// Hàm mở form thêm giao dịch
function openAddForm() {
  // Cập nhật lại nếu cần
  document.getElementById('transactionForm').reset();
  document.getElementById('formTitle').textContent = 'Thêm giao dịch mới';
  document.getElementById('transactionId').value = '';
  document.getElementById('formOverlay').style.display = 'block';
}

// Hàm mở form chỉnh sửa giao dịch
function openEditForm(transaction) {
  document.getElementById('formTitle').textContent = 'Chỉnh sửa giao dịch';
  document.getElementById('transactionId').value = transaction.id;
  document.getElementById('transactionDate').value = transaction.date.split('/').reverse().join('-');
  document.getElementById('transactionType').value = transaction.type;
  document.getElementById('transactionContent').value = transaction.content;
  document.getElementById('transactionAmount').value = transaction.amount;
  document.getElementById('transactionCategory').value = transaction.category;
  document.getElementById('transactionNote').value = transaction.note || '';
  document.getElementById('formOverlay').style.display = 'block';
}

// Hàm xóa giao dịch
async function deleteTransaction(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;

  try {
    const url = `${apiUrl}?action=deleteTransaction&sheetId=${sheetId}&id=${id}`;
    const response = await fetch(url, { method: 'POST' });
    const result = await response.json();
    if (result.error) throw new Error(result.error);

    alert('Xóa giao dịch thành công!');
    // Cập nhật lại dữ liệu sau khi xóa
    window.fetchTransactions();
    window.fetchMonthlyExpenses();
    window.searchTransactions();
  } catch (error) {
    alert('Lỗi khi xóa giao dịch: ' + error.message);
  }
}

// Hàm khởi tạo khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => window.openTab(item.getAttribute('data-tab')));
  });

  document.getElementById('fetchDataBtn').addEventListener('click', window.fetchData);
  document.getElementById('fetchMonthlyDataBtn').addEventListener('click', window.fetchMonthlyData);
  document.getElementById('fetchTransactionsBtn').addEventListener('click', window.fetchTransactions);
  document.getElementById('addTransactionBtn').addEventListener('click', openAddForm);
  document.getElementById('fetchMonthlyExpensesBtn').addEventListener('click', window.fetchMonthlyExpenses);
  document.getElementById('searchTransactionsBtn').addEventListener('click', window.searchTransactions);

  // Phân trang cho tab 1 (Giao dịch)
  document.getElementById('prevPage').addEventListener('click', () => {
    if (paginationState.tab1.currentPage > 1) {
      paginationState.tab1.currentPage--;
      displayTransactionsGeneric({
        data: paginationState.tab1.cachedData?.data,
        tabId: 'tab1',
        containerId: 'transactionsContainer',
        pageInfoId: 'pageInfo',
        prevPageId: 'prevPage',
        nextPageId: 'nextPage',
        noDataMessage: 'Không có giao dịch nào trong ngày này'
      });
    }
  });
  document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil((paginationState.tab1.cachedData?.data.length || 0) / paginationState.tab1.itemsPerPage);
    if (paginationState.tab1.currentPage < totalPages) {
      paginationState.tab1.currentPage++;
      displayTransactionsGeneric({
        data: paginationState.tab1.cachedData?.data,
        tabId: 'tab1',
        containerId: 'transactionsContainer',
        pageInfoId: 'pageInfo',
        prevPageId: 'prevPage',
        nextPageId: 'nextPage',
        noDataMessage: 'Không có giao dịch nào trong ngày này'
      });
    }
  });

  // Phân trang cho tab 5 (Chi tiêu trong tháng)
  document.getElementById('prevPageMonthly').addEventListener('click', () => {
    if (paginationState.tab5.currentPage > 1) {
      paginationState.tab5.currentPage--;
      displayTransactionsGeneric({
        data: paginationState.tab5.cachedData?.data,
        tabId: 'tab5',
        containerId: 'monthlyExpensesContainer',
        pageInfoId: 'pageInfoMonthly',
        prevPageId: 'prevPageMonthly',
        nextPageId: 'nextPageMonthly',
        noDataMessage: 'Không có giao dịch trong tháng này',
        updateSummaryCallback: (summaryData) => {
          const summaryContainer = document.getElementById('monthlyExpenseSummary');
          if (!summaryData) {
            summaryContainer.innerHTML = `
              <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
              <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
              <div class="stat-box balance"><div class="title">Số dư</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
            `;
          } else {
            summaryContainer.innerHTML = `
              <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount">${summaryData.income.toLocaleString('vi-VN')}đ</div></div>
              <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount">${summaryData.expense.toLocaleString('vi-VN')}đ</div></div>
              <div class="stat-box balance"><div class="title">Số dư</div><div class="amount">${summaryData.balance.toLocaleString('vi-VN')}đ</div></div>
            `;
          }
        }
      });
    }
  });
  document.getElementById('nextPageMonthly').addEventListener('click', () => {
    const totalPages = Math.ceil((paginationState.tab5.cachedData?.data.length || 0) / paginationState.tab5.itemsPerPage);
    if (paginationState.tab5.currentPage < totalPages) {
      paginationState.tab5.currentPage++;
      displayTransactionsGeneric({
        data: paginationState.tab5.cachedData?.data,
        tabId: 'tab5',
        containerId: 'monthlyExpensesContainer',
        pageInfoId: 'pageInfoMonthly',
        prevPageId: 'prevPageMonthly',
        nextPageId: 'nextPageMonthly',
        noDataMessage: 'Không có giao dịch trong tháng này',
        updateSummaryCallback: (summaryData) => {
          const summaryContainer = document.getElementById('monthlyExpenseSummary');
          if (!summaryData) {
            summaryContainer.innerHTML = `
              <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
              <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
              <div class="stat-box balance"><div class="title">Số dư</div><div class="amount no-data">Không có<br>dữ liệu</div></div>
            `;
          } else {
            summaryContainer.innerHTML = `
              <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount">${summaryData.income.toLocaleString('vi-VN')}đ</div></div>
              <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount">${summaryData.expense.toLocaleString('vi-VN')}đ</div></div>
              <div class="stat-box balance"><div class="title">Số dư</div><div class="amount">${summaryData.balance.toLocaleString('vi-VN')}đ</div></div>
            `;
          }
        }
      });
    }
  });

  // Phân trang cho tab 6 (Tìm kiếm giao dịch)
  document.getElementById('prevPageSearch').addEventListener('click', () => {
    if (paginationState.tab6.currentPage > 1) {
      paginationState.tab6.currentPage--;
      displayTransactionsGeneric({
        data: paginationState.tab6.cachedData?.data,
        tabId: 'tab6',
        containerId: 'searchResultsContainer',
        pageInfoId: 'pageInfoSearch',
        prevPageId: 'prevPageSearch',
        nextPageId: 'nextPageSearch',
        noDataMessage: 'Không tìm thấy giao dịch nào phù hợp'
      });
    }
  });
  document.getElementById('nextPageSearch').addEventListener('click', () => {
    const totalPages = Math.ceil((paginationState.tab6.cachedData?.data.length || 0) / paginationState.tab6.itemsPerPage);
    if (paginationState.tab6.currentPage < totalPages) {
      paginationState.tab6.currentPage++;
      displayTransactionsGeneric({
        data: paginationState.tab6.cachedData?.data,
        tabId: 'tab6',
        containerId: 'searchResultsContainer',
        pageInfoId: 'pageInfoSearch',
        prevPageId: 'prevPageSearch',
        nextPageId: 'nextPageSearch',
        noDataMessage: 'Không tìm thấy giao dịch nào phù hợp'
      });
    }
  });

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  document.getElementById('startDate').value = formatDateToYYYYMMDD(startDate);
  document.getElementById('endDate').value = formatDateToYYYYMMDD(today);
  document.getElementById('startMonth').value = 1;
  document.getElementById('endMonth').value = 12;
  document.getElementById('transactionDate').value = formatDateToYYYYMMDD(today);
  document.getElementById('expenseMonth').value = today.getMonth() + 1;
  document.getElementById('searchMonth').value = '';

  populateSearchCategories();
  window.openTab('tab1');
});
