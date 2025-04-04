<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Mini App tổng quan chi tiêu</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
</head>
<body>
  <div class="top-nav">
    <div class="nav-item active" data-tab="tab1"><i class="fas fa-list"></i><span>Giao dịch</span></div>
    <div class="nav-item" data-tab="tab2"><i class="fas fa-table"></i><span>Thống kê</span></div>
    <div class="nav-item" data-tab="tab3"><i class="fas fa-chart-bar"></i><span>Biểu đồ</span></div>
    <div class="nav-item" data-tab="tab4"><i class="fas fa-info-circle"></i><span>Giới thiệu</span></div>
  </div>

  <div class="content-wrapper">
    <div id="tab1" class="tab-content active">
      <h1>GIAO DỊCH TRONG NGÀY</h1>
      <p class="notification">Vui lòng chọn ngày và ấn "Lọc" để xem dữ liệu.</p>
      <div id="errorMessageTab1" style="color: red; text-align: center; display: none; margin-bottom: 1rem;"></div>
      <div id="successMessageTab1" style="color: green; text-align: center; display: none; margin-bottom: 1rem;"></div>
      <div id="loadingTab1" style="display: none; text-align: center; margin: 1rem 0;">
        <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--primary-color);"></i>
      </div>
      <div class="input-group">
        Ngày: <input type="date" id="transactionDate">
        <button id="fetchTransactionsBtn">Lọc</button>
        <button id="addTransactionBtn">Thêm</button>
      </div>
      <div class="stats-container" id="dailySummary">
        <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount">0đ</div></div>
        <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount">0đ</div></div>
        <div class="stat-box balance"><div class="title">Số dư</div><div class="amount">0đ</div></div>
      </div>
      <div class="transactions-list" id="transactionsContainer"></div>
      <div id="pagination" style="text-align: center; margin-top: 1rem;">
        <button id="prevPage" disabled>Trang trước</button>
        <span id="pageInfo"></span>
        <button id="nextPage">Trang sau</button>
      </div>
    </div>

    <div id="tab2" class="tab-content">
      <h1>THỐNG KẾ</h1>
      <p class="notification">Vui lòng chọn khoảng thời gian và ấn "Lọc" để xem dữ liệu.</p>
      <div id="errorMessageTab2" style="color: red; text-align: center; display: none; margin-bottom: 1rem;"></div>
      <div id="successMessageTab2" style="color: green; text-align: center; display: none; margin-bottom: 1rem;"></div>
      <div id="loadingTab2" style="display: none; text-align: center; margin: 1rem 0;">
        <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--primary-color);"></i>
      </div>
      <div class="input-group">
        Từ: <input type="date" id="startDate"> 
        Đến: <input type="date" id="endDate"> 
        <button id="fetchDataBtn">Lọc</button>
      </div>
      <div class="stats-container" id="statsContainer">
        <div class="stat-box income"><div class="title">Tổng thu nhập</div><div class="amount">0đ</div></div>
        <div class="stat-box expense"><div class="title">Tổng chi tiêu</div><div class="amount">0đ</div></div>
        <div class="stat-box balance"><div class="title">Số dư</div><div class="amount">0đ</div></div>
      </div>
      <div class="chart-container">
        <h1>BIỂU ĐỒ CHI TIÊU</h1>
        <canvas id="myChart"></canvas>
      </div>
      <div class="custom-legend" id="customLegend"></div>
    </div>

    <div id="tab3" class="tab-content">
      <h1>BIỂU ĐỒ THU CHI THEO THÁNG</h1>
      <p class="notification">Vui lòng chọn khoảng thời gian và ấn "Lọc" để xem dữ liệu.</p>
      <div id="errorMessageTab3" style="color: red; text-align: center; display: none; margin-bottom: 1rem;"></div>
      <div id="successMessageTab3" style="color: green; text-align: center; display: none; margin-bottom: 1rem;"></div>
      <div id="loadingTab3" style="display: none; text-align: center; margin: 1rem 0;">
        <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; color: var(--primary-color);"></i>
      </div>
      <div class="input-group">
        Từ: 
        <select id="startMonth">
          <option value="1">Tháng 1</option><option value="2">Tháng 2</option><option value="3">Tháng 3</option>
          <option value="4">Tháng 4</option><option value="5">Tháng 5</option><option value="6">Tháng 6</option>
          <option value="7">Tháng 7</option><option value="8">Tháng 8</option><option value="9">Tháng 9</option>
          <option value="10">Tháng 10</option><option value="11">Tháng 11</option><option value="12">Tháng 12</option>
        </select>
        Đến: 
        <select id="endMonth">
          <option value="1">Tháng 1</option><option value="2">Tháng 2</option><option value="3">Tháng 3</option>
          <option value="4">Tháng 4</option><option value="5">Tháng 5</option><option value="6">Tháng 6</option>
          <option value="7">Tháng 7</option><option value="8">Tháng 8</option><option value="9">Tháng 9</option>
          <option value="10">Tháng 10</option><option value="11">Tháng 11</option><option value="12">Tháng 12</option>
        </select>
        <button id="fetchMonthlyDataBtn">Lọc</button>
      </div>
      <div class="chart-container">
        <canvas id="monthlyChart"></canvas>
        <div class="monthly-legend" id="monthlyLegend"></div>
      </div>
    </div>

    <div id="tab4" class="tab-content">
      <h1>GIỚI THIỆU</h1>
      <div class="info-section">
        <div class="info-card">
          <h1>Về MiniApp</h1>
          <p class="custom-text">Miniapp tài chính trên Telegram giúp bạn theo dõi thu nhập và chi tiêu dễ dàng. Dựa vào dữ liệu trong Google Sheet nó sẽ hiển thị danh sách giao dịch trong ngày, biểu đồ chi tiêu theo phân loại chi tiết và biểu đồ thu nhập – chi tiêu hàng tháng ngay trong Telegram.</p>
        </div>
        <div class="info-card">
          <h1>Ủng hộ</h1>
          <p class="custom-text">Nếu bạn thấy nó hữu ích, hãy ủng hộ mình một ly cà phê để có thêm động lực duy trì và phát triển nhé!</p>
          <p><i class="fas fa-university" style="color: var(--accent-color);"></i><strong>Ngân hàng:</strong> TMCP Sài Gòn – Hà Nội (SHB)</p>
          <p><i class="fas fa-user" style="color: var(--accent-color);"></i><strong>Chủ tài khoản:</strong> Hoang Manh Hung</p>
          <p><i class="fas fa-credit-card" style="color: var(--accent-color);"></i><strong>Số tài khoản:</strong> 6666.6789.9999</p>
        </div>
        <div class="qr-container">
          <a href="https://momo.vn/" target="_blank" class="cta-button">Ủng hộ ngay</a>
          <div class="qr-frame">
            <img id="qrImage" src="https://i.pinimg.com/736x/7c/13/53/7c135389e26cbc6460626deb9e2aa5c6.jpg" alt="QR Code" class="qr-image">
          </div>
          <p class="qr-caption">Quét mã QR để ủng hộ qua Momo</p>
        </div>
        <div class="info-card">
          <h1>Liên hệ</h1>
          <div class="contact-columns">
            <p><i class="fas fa-user" style="color: var(--primary-color);"></i><strong>Người tạo:</strong> <span class="highlight-color">Hoàng Hùng</span></p>
            <p><i class="fab fa-telegram-plane" style="color: var(--primary-color);"></i><strong>Telegram:</strong> <a href="https://t.me/masterhmh" target="_blank">@masterhmh</a></p>
            <p><i class="fab fa-facebook" style="color: var(--primary-color);"></i><strong>Facebook:</strong> <a href="https://facebook.com/masterhmh" target="_blank">facebook.com/masterhmh</a></p>
            <p><i class="fas fa-envelope" style="color: var(--primary-color);"></i><strong>Email:</strong> <a href="mailto:masterhmh@gmail.com">masterhmh@gmail.com</a></p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="editModal" class="modal">
    <div class="modal-content">
      <h2>Chỉnh sửa giao dịch</h2>
      <div id="editError" class="error-message"></div>
      <form id="editForm">
        <input type="hidden" id="editTransactionId">
        <label for="editDate">Ngày (dd/MM):</label>
        <input type="text" id="editDate" required pattern="\d{1,2}/\d{1,2}" placeholder="dd/MM">
        <label for="editContent">Nội dung:</label>
        <input type="text" id="editContent" required>
        <label for="editAmount">Số tiền:</label>
        <input type="number" id="editAmount" min="0" required>
        <label for="editType">Phân loại:</label>
        <select id="editType" required>
          <option value="Thu nhập">Thu nhập</option>
          <option value="Chi tiêu">Chi tiêu</option>
        </select>
        <label for="editCategory">Phân loại chi tiết:</label>
        <select id="editCategory" required></select>
        <label for="editNote">Ghi chú (nếu có):</label>
        <textarea id="editNote"></textarea>
        <div class="btn-group">
          <button type="button" class="cancel-btn" onclick="closeEditForm()">Hủy</button>
          <button type="submit" class="save-btn">Lưu</button>
        </div>
      </form>
    </div>
  </div>

  <div id="addModal" class="modal">
    <div class="modal-content">
      <h2>Thêm giao dịch mới</h2>
      <div id="addError" class="error-message"></div>
      <form id="addForm">
        <label for="addDate">Ngày (dd/MM):</label>
        <input type="text" id="addDate" required pattern="\d{1,2}/\d{1,2}" placeholder="dd/MM">
        <label for="addContent">Nội dung:</label>
        <input type="text" id="addContent" required>
        <label for="addAmount">Số tiền:</label>
        <input type="number" id="addAmount" min="0" required>
        <label for="addType">Phân loại:</label>
        <select id="addType" required>
          <option value="Thu nhập">Thu nhập</option>
          <option value="Chi tiêu">Chi tiêu</option>
        </select>
        <label for="addCategory">Phân loại chi tiết:</label>
        <select id="addCategory" required></select>
        <label for="addNote">Ghi chú (nếu có):</label>
        <textarea id="addNote"></textarea>
        <div class="btn-group">
          <button type="button" class="cancel-btn" onclick="closeAddForm()">Hủy</button>
          <button type="submit" class="save-btn">Lưu</button>
        </div>
      </form>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>
