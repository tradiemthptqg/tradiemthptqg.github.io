addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Cấu hình Khóa Bí mật của Turnstile (Lưu ý: Thực tế nên khai báo trong Settings -> Variables của Worker)
const TURNSTILE_SECRET_KEY = "0x4AAAAAAAMe-YOUR-SECRET-KEY-HERE";

// Tiêu đề CORS chuẩn hỗ trợ cho GitHub Pages gọi an toàn
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Có thể thay bằng domain GitHub Pages cụ thể của bạn để thắt chặt bảo mật
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

async function handleRequest(request) {
  // Xử lý tiền kiểm tra (Preflight Request) của CORS phương thức OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Chặn toàn bộ các method khác ngoài POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: "Phương thức không được hỗ trợ." }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { sbd, province, token } = body;

    // 1. Kiểm tra tính toàn vẹn của dữ liệu đầu vào cơ bản
    if (!sbd || !province || !token) {
      return new Response(JSON.stringify({ success: false, message: "Thiếu dữ liệu đầu vào bắt buộc." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Tiến hành xác thực mã Token Captcha với Gateway Cloudflare Turnstile
    let formData = new FormData();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    formData.append('remoteip', request.headers.get('CF-Connecting-IP'));

    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const result = await fetch(url, {
      body: formData,
      method: 'POST',
    });

    const outcome = await result.json();
    
    // Nếu Captcha không hợp lệ hoặc đã hết hạn
    if (!outcome.success) {
      return new Response(JSON.stringify({ success: false, message: "Xác thực Captcha thất bại hoặc mã bảo mật hết hạn." }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Thực hiện Proxy/Forward Request đến Cổng dữ liệu gốc của Bộ Giáo dục & Đào tạo công bố
    // Giả định địa chỉ Cổng thông tin điểm thi chính thức Quốc gia (Cấu trúc REST API thực tế)
    const MOET_API_ENDPOINT = `https://diemthi.vnanet.vn/Home/SearchBySbd?sbd=${sbd}&camp=2026`;
    
    const moetResponse = await fetch(MOET_API_ENDPOINT, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://diemthi.vnanet.vn/'
      }
    });

    if (!moetResponse.ok) {
      return new Response(JSON.stringify({ success: false, message: "Cổng dữ liệu của Bộ Giáo dục hiện tại đang quá tải. Vui lòng thử lại sau vài giây." }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const rawData = await moetResponse.json();

    // 4. Chuẩn hóa cấu trúc dữ liệu trả về từ API gốc thành định dạng đồng nhất cho Client Frontend
    // Đoạn logic này ánh xạ chính xác kết quả phân tích chuỗi dữ liệu điểm
    const formattedData = parseMoetDataToStandard(rawData, sbd);

    if (!formattedData) {
      return new Response(JSON.stringify({ success: false, message: "Không tìm thấy kết quả thi cho Số báo danh này." }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: formattedData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: "Lỗi xử lý hệ thống nội bộ backend: " + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Hàm hỗ trợ xử lý cấu trúc phản hồi thô từ cổng dữ liệu quốc gia sang JSON sạch.
 * Tùy biến tương ứng với format thực tế của Cổng thông tin (Ví dụ bên dưới xử lý định dạng chuẩn vnanet/moet công bố).
 */
function parseMoetDataToStandard(rawData, sbd) {
  // Kiểm tra tính hợp lệ của mảng trả về từ dữ liệu gốc
  if (!rawData || !rawData.result || rawData.result.length === 0) {
    return null;
  }
  
  const studentInfo = rawData.result[0];
  
  // Trích xuất cấu trúc trường điểm
  return {
    sbd: sbd,
    subjects: {
      toan: studentInfo.Toan || null,
      van: studentInfo.NguVan || null,
      ngoai_ngu: studentInfo.NgoaiNgu || null,
      vat_ly: studentInfo.VatLy || null,
      hoa_hoc: studentInfo.HoaHoc || null,
      sinh_hoc: studentInfo.SinhHoc || null,
      lich_su: studentInfo.LichSu || null,
      dia_ly: studentInfo.DiaLy || null,
      gdcd: studentInfo.GDCD || null
    }
  };
}
