// CẤU HÌNH HỆ THỐNG TOÀN CỤC
const CONFIG = {
    // Thời gian công bố điểm chính thức: 08:00 AM ngày 16/07/2026 Múi giờ Việt Nam (UTC+7)
    RELEASE_DATE_UTC7: new Date('2026-07-16T08:00:00+07:00'),
    // Địa chỉ Worker API của bạn trên Cloudflare
    API_ENDPOINT: 'https://tradiemthptqg.anntuongg.workers.dev/api/lookup',
    // Site Key của Cloudflare Turnstile cấp cho Frontend tĩnh
    TURNSTILE_SITEKEY: '0x4AAAAAADtg_d8LBGzrMD_y' 
};

// Danh sách 63 Tỉnh Thành Việt Nam theo mã quy chuẩn thi THPT Quốc Gia
const PROVINCES = [
    { code: "01", name: "Thành phố Hà Nội" },
    { code: "02", name: "Thành phố Hồ Chí Minh" },
    { code: "03", name: "Thành phố Hải Phòng" },
    { code: "04", name: "Thành phố Đà Nẵng" },
    { code: "05", name: "Thành phố Cần Thơ" },
    { code: "06", name: "Tỉnh Hà Giang" },
    { code: "07", name: "Tỉnh Cao Bằng" },
    { code: "08", name: "Tỉnh Tuyên Quang" },
    { code: "09", name: "Tỉnh Lào Cai" },
    { code: "10", name: "Tỉnh Điện Biên" },
    { code: "11", name: "Tỉnh Lai Châu" },
    { code: "12", name: "Tỉnh Sơn La" },
    { code: "13", name: "Tỉnh Yên Bái" },
    { code: "14", name: "Tỉnh Hòa Bình" },
    { code: "15", name: "Tỉnh Thái Nguyên" },
    { code: "16", name: "Tỉnh Lạng Sơn" },
    { code: "17", name: "Tỉnh Quảng Ninh" },
    { code: "18", name: "Tỉnh Bắc Giang" },
    { code: "19", name: "Tỉnh Phú Thọ" },
    { code: "21", name: "Tỉnh Vĩnh Phúc" },
    { code: "22", name: "Tỉnh Bắc Ninh" },
    { code: "23", name: "Tỉnh Hải Dương" },
    { code: "24", name: "Tỉnh Hưng Yên" },
    { code: "25", name: "Tỉnh Thái Bình" },
    { code: "26", name: "Tỉnh Hà Nam" },
    { code: "27", name: "Tỉnh Nam Định" },
    { code: "28", name: "Tỉnh Ninh Bình" },
    { code: "29", name: "Tỉnh Thanh Hóa" },
    { code: "30", name: "Tỉnh Nghệ An" },
    { code: "31", name: "Tỉnh Hà Tĩnh" },
    { code: "32", name: "Tỉnh Quảng Bình" },
    { code: "33", name: "Tỉnh Quảng Trị" },
    { code: "34", name: "Tỉnh Thừa Thiên Huế" },
    { code: "35", name: "Tỉnh Quảng Nam" },
    { code: "36", name: "Tỉnh Quảng Ngãi" },
    { code: "37", name: "Tỉnh Bình Định" },
    { code: "38", name: "Tỉnh Phú Yên" },
    { code: "39", name: "Tỉnh Khánh Hòa" },
    { code: "40", name: "Tỉnh Ninh Thuận" },
    { code: "41", name: "Tỉnh Bình Thuận" },
    { code: "42", name: "Tỉnh Kon Tum" },
    { code: "43", name: "Tỉnh Gia Lai" },
    { code: "44", name: "Tỉnh Đắk Lắk" },
    { code: "45", name: "Tỉnh Đắk Nông" },
    { code: "46", name: "Tỉnh Lâm Đồng" },
    { code: "47", name: "Tỉnh Bình Phước" },
    { code: "48", name: "Tỉnh Tây Ninh" },
    { code: "49", name: "Tỉnh Bình Dương" },
    { code: "50", name: "Tỉnh Đồng Nai" },
    { code: "51", name: "Tỉnh Bà Rịa - Vũng Tàu" },
    { code: "52", name: "Tỉnh Long An" },
    { code: "53", name: "Tỉnh Tiền Giang" },
    { code: "54", name: "Tỉnh Bến Tre" },
    { code: "55", name: "Tỉnh Trà Vinh" },
    { code: "56", name: "Tỉnh Vĩnh Long" },
    { code: "57", name: "Tỉnh Đồng Tháp" },
    { code: "58", name: "Tỉnh An Giang" },
    { code: "59", name: "Tỉnh Kiên Giang" },
    { code: "60", name: "Tỉnh Cần Thơ (Cũ)" }, // Dự phòng mã lưu trữ lịch sử
    { code: "61", name: "Tỉnh Hậu Giang" },
    { code: "62", name: "Tỉnh Sóc Trăng" },
    { code: "63", name: "Tỉnh Bạc Liêu" },
    { code: "64", name: "Tỉnh Cà Mau" }
];

let systemTimeOffset = 0; // Độ lệch miligiây giữa Client và NTP Server
let turnstileWidgetId = null;

document.addEventListener("DOMContentLoaded", async () => {
    initProvincesDropdown();
    await synchronizeTime();
    startClockAndLockLogic();
    initFormHandlers();
});

// Khởi tạo danh sách dropdown tỉnh thành
function initProvincesDropdown() {
    const dropdown = document.getElementById("province");
    PROVINCES.forEach(p => {
        const option = document.createElement("option");
        option.value = p.code;
        option.textContent = `${p.code} - ${p.name}`;
        dropdown.appendChild(option);
    });
}

// Hàm lấy thời gian chuẩn từ API đáng tin cậy chống sửa giờ máy client
async function synchronizeTime() {
    const clockDisplay = document.getElementById("server-clock-container");
    try {
        const startTime = Date.now();
        // Sử dụng WorldTimeAPI hoặc fallback qua tiêu đề Date của các gateway lớn
        const response = await fetch("https://worldtimeapi.org/api/timezone/Asia/Ho_Chi_Minh");
        if (!response.ok) throw new Error("Lỗi kết nối Time Server");
        
        const data = await response.json();
        const serverTime = new Date(data.datetime).getTime();
        const latency = (Date.now() - startTime) / 2;
        
        // Tính toán độ lệch thời gian hệ thống
        systemTimeOffset = (serverTime + latency) - Date.now();
        clockDisplay.textContent = "Hệ thống thời gian: Đã đồng bộ trực tuyến";
    } catch (error) {
        console.warn("Không thể tải WorldTimeAPI, tiến hành đồng bộ qua HTTP Header...", error);
        try {
            const response = await fetch(window.location.href, { method: 'HEAD' });
            const serverDateStr = response.headers.get('Date');
            if (serverDateStr) {
                const serverTime = new Date(serverDateStr).getTime();
                systemTimeOffset = serverTime - Date.now();
                clockDisplay.textContent = "Hệ thống thời gian: Đồng bộ qua Gateway";
            }
        } catch (subError) {
            console.error("Mất kết nối đồng bộ thời gian hoàn toàn.", subError);
            clockDisplay.textContent = "Hệ thống thời gian: Ngoại tuyến (Tạm thời)";
            systemTimeOffset = 0;
        }
    }
}

// Lấy thời gian hiện tại sau khi đã bù trừ độ lệch đồng bộ
function getSyncedCurrentTime() {
    return new Date(Date.now() + systemTimeOffset);
}

// Cơ chế vòng lặp kiểm tra lock-time và cập nhật giao diện thời gian thực
function startClockAndLockLogic() {
    const lockScreen = document.getElementById("lock-screen");
    const searchScreen = document.getElementById("search-screen");
    const clockDisplay = document.getElementById("server-clock-container");

    const checkInterval = setInterval(() => {
        const now = getSyncedCurrentTime();
        
        // Cập nhật chuỗi hiển thị đồng hồ thời gian thực dạng UTC+7 trên Header
        const timeString = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
        const dateString = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        clockDisplay.textContent = `Hệ thống: ${timeString} - ${dateString} (Múi giờ ICT)`;

        // So sánh thời gian mở khóa
        if (now.getTime() < CONFIG.RELEASE_DATE_UTC7.getTime()) {
            if (lockScreen.classList.contains("hidden")) {
                lockScreen.classList.remove("hidden");
                searchScreen.classList.add("hidden");
            }
        } else {
            // Đã đạt hoặc vượt qua mốc 08:00 AM ngày công bố
            if (searchScreen.classList.contains("hidden")) {
                lockScreen.classList.add("hidden");
                searchScreen.classList.remove("hidden");
                initCloudflareTurnstile(); // Khởi tạo captcha khi form xuất hiện
                clearInterval(checkInterval); // Huỷ loop để tối ưu tài nguyên
            }
        }
    }, 1000);
}

// Khởi tạo Cloudflare Turnstile Widget
function initCloudflareTurnstile() {
    if (window.turnstile && turnstileWidgetId === null) {
        turnstileWidgetId = turnstile.render('#turnstile-container', {
            sitekey: CONFIG.TURNSTILE_SITEKEY,
            theme: 'light',
            callback: function(token) {
                document.getElementById("btn-submit").removeAttribute("disabled");
            },
            'expired-callback': function() {
                document.getElementById("btn-submit").setAttribute("disabled", "true");
            }
        });
    }
}

// Xử lý sự kiện Submit Form tra cứu
function initFormHandlers() {
    const form = document.getElementById("search-form");
    const btnSubmit = document.getElementById("btn-submit");
    const loader = document.getElementById("loader");
    const errorContainer = document.getElementById("error-container");
    const resultContainer = document.getElementById("result-container");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const sbdInput = document.getElementById("sbd").value.trim();
        const provinceCode = document.getElementById("province").value;
        
        // Xác thực định dạng SBD phía Client (8 ký tự số)
        const sbdRegex = /^[0-9]{8}$/;
        if (!sbdRegex.test(sbdInput)) {
            showError("Số báo danh không hợp lệ. Vui lòng nhập đúng 8 chữ số.");
            return;
        }

        // Kiểm tra xem 2 số đầu của SBD có trùng khớp với mã tỉnh đã chọn không
        if (sbdInput.substring(0, 2) !== provinceCode) {
            showError("Số báo danh không khớp với Tỉnh/Thành phố đã lựa chọn.");
            return;
        }

        let turnstileToken = "";
        if (window.turnstile) {
            turnstileToken = turnstile.getResponse(turnstileWidgetId);
            if (!turnstileToken) {
                showError("Vui lòng hoàn thành xác thực bảo mật Captcha.");
                return;
            }
        }

        // Bật trạng thái loading, ẩn kết quả cũ
        btnSubmit.setAttribute("disabled", "true");
        btnSubmit.classList.add("hidden");
        loader.classList.remove("hidden");
        errorContainer.classList.add("hidden");
        resultContainer.classList.add("hidden");

        try {
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sbd: sbdInput,
                    province: provinceCode,
                    token: turnstileToken
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Không thể truy vấn điểm số từ máy chủ.");
            }

            renderScores(result.data, sbdInput, provinceCode);

        } catch (err) {
            showError(err.message);
            // Reset lại Captcha để người dùng thực hiện lại nếu lỗi xảy ra
            if (window.turnstile) turnstile.reset(turnstileWidgetId);
        } finally {
            loader.classList.add("hidden");
            btnSubmit.classList.remove("hidden");
            btnSubmit.removeAttribute("disabled");
        }
    });
}

function showError(message) {
    const errorContainer = document.getElementById("error-container");
    errorContainer.textContent = message;
    errorContainer.classList.remove("hidden");
}

// Kết xuất bảng điểm dựa trên dữ liệu chuẩn trả về từ Worker
function renderScores(data, sbd, provinceCode) {
    const resultContainer = document.getElementById("result-container");
    const resSbd = document.getElementById("res-sbd");
    const resProvince = document.getElementById("res-province");
    const resTimestamp = document.getElementById("res-timestamp");
    const tableBody = document.getElementById("score-table-body");

    resSbd.textContent = sbd;
    const provObj = PROVINCES.find(p => p.code === provinceCode);
    resProvince.textContent = provObj ? provObj.name : provinceCode;
    resTimestamp.textContent = `Thời gian truy xuất: ${new Date().toLocaleTimeString('vi-VN')}`;

    tableBody.innerHTML = ""; // Clear dữ liệu cũ

    // Bản đồ tên môn học tường minh
    const subjectMap = {
        toan: "Toán học",
        van: "Ngữ văn",
        ngoai_ngu: "Tiếng Anh",
        vat_ly: "Vật lí",
        hoa_hoc: "Hóa học",
        sinh_hoc: "Sinh học",
        lich_su: "Lịch sử",
        dia_ly: "Địa lí",
        gdcd: "Giáo dục công dân"
    };

    // Duyệt qua dữ liệu môn học trả về để chèn vào table
    Object.entries(data.subjects).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== "") {
            const row = document.createElement("tr");
            row.className = "border-b border-gray-100 hover:bg-gray-50/50 transition-colors";
            
            const cellName = document.createElement("td");
            cellName.className = "py-3 px-4 font-medium text-gray-800";
            cellName.textContent = subjectMap[key] || key.toUpperCase();

            const cellScore = document.createElement("td");
            cellScore.className = "py-3 px-4 text-right font-bold text-[#6750A4] text-base";
            cellScore.textContent = parseFloat(val).toFixed(2);

            row.appendChild(cellName);
            row.appendChild(cellScore);
            tableBody.appendChild(row);
        }
    });

    resultContainer.classList.remove("hidden");
    // Cuộn mượt màn hình đến khu vực hiển thị điểm
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}
