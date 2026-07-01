import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
  useParams,
} from "react-router-dom";

// --- 1. CẤU HÌNH ROUTING CHÍNH ---
export const AppRoutes = () => {
  const location = useLocation();

  // Kiểm tra xem có location cũ được truyền qua state không
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      {/* MAIN ROUTES (BACKGROUND LAYER)
        Nếu backgroundLocation tồn tại, React Router sẽ "đóng băng" 
        và hiển thị giao diện của trang cũ làm background.
      */}
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspaces/:id" element={<WorkspaceDetail />} />

        {/* Fallback quan trọng: Nếu user tải lại trang (F5) trực tiếp tại URL edit, 
            backgroundLocation sẽ mất. Khi đó ta render form Edit full màn hình (không phải popup) */}
        <Route path="/workspaces/:id/edit" element={<WorkspaceEditStandalone />} />
      </Routes>

      {/* MODAL ROUTES (FOREGROUND LAYER)
        Khối này chỉ chạy khi đang có background (tức là user đi từ 1 trang khác tới)
      */}
      {backgroundLocation && (
        <Routes>
          <Route path="/workspaces/:id/edit" element={<WorkspaceEditModal />} />
        </Routes>
      )}
    </>
  );
};

// --- 2. CÁC MÀN HÌNH VÍ DỤ ---
const Dashboard = () => {
  const location = useLocation();
  const id = "123";

  return (
    <div style={{ padding: "20px", background: "#e0f7fa", minHeight: "100vh" }}>
      <h1>Dashboard (Background 1)</h1>

      {/* Truyền kèm "state" chứa location hiện tại để hệ thống biết background là gì */}
      <Link to={`/workspaces/${id}/edit?retUrl=${location.pathname}`} state={{ backgroundLocation: location }}>
        <button>Edit Workspace {id} từ Dashboard</button>
      </Link>
    </div>
  );
};

const WorkspaceDetail = () => {
  const { id } = useParams();
  const location = useLocation();

  return (
    <div style={{ padding: "20px", background: "#fff3e0", minHeight: "100vh" }}>
      <h1>Workspace Detail: {id} (Background 2)</h1>

      <Link to={`/workspaces/${id}/edit?retUrl=${location.pathname}`} state={{ backgroundLocation: location }}>
        <button>Edit Workspace từ Detail</button>
      </Link>
    </div>
  );
};

// --- 3. MODAL COMPONENT ---
const WorkspaceEditModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleClose = () => {
    // 1. Lấy retUrl từ URL
    const retUrl = searchParams.get("retUrl") || "/";
    // 2. Quay về trang trước đó
    navigate(retUrl);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Sửa Workspace: {id} (Dạng Popup)</h2>
        <p>Phía sau tôi vẫn là giao diện của người dùng lúc nãy!</p>

        <button onClick={handleClose}>Lưu & Đóng</button>
      </div>
    </div>
  );
};

// --- 4. STANDALONE COMPONENT (KHI F5) ---
const WorkspaceEditStandalone = () => {
  const { id } = useParams();
  return (
    <div style={{ padding: "20px" }}>
      <h2>Sửa Workspace: {id} (Dạng Full-page)</h2>
      <p>Bạn vừa F5 trình duyệt, nên không có background cũ nào để hiển thị cả.</p>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modal: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    minWidth: "400px",
  },
};
