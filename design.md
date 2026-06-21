# Workspace CRUD + Prompt Generator Design

## 1. Muc tieu
- Tao mot React page de thao tac CRUD voi workspace thong qua `workspacesClient`.
- UI chia 2 vung:
  - Sidebar: danh sach workspace, vao workspace thi hien danh sach prompt va nut Back.
  - Content: thong tin workspace, thong tin prompt duoc chon va khu vuc prompt generator.
- Prompt generator doc token trong noi dung prompt de tao form input dong.

## 2. Kien truc tong quan
- Entry: `App` render `WorkspacesPage`.
- Data layer:
  - `workspacesClient.getWorkspaces()` lay danh sach workspace.
  - `workspacesClient.getWorkspace(name)` lay chi tiet workspace + prompts.
  - `workspacesClient.createWorkspace(payload)` tao workspace.
  - `workspacesClient.updateWorkspace(payload)` cap nhat workspace.
  - `workspacesClient.deleteWorkspace(name)` xoa workspace.
- Network bridge:
  - `gasClient` da duoc sua de goi `window.google.script.run.invoke` theo dung format `<METHOD>:<URL>` va tra ve Promise.
  - `GasServer` da bo sung match route dong (`:name`) va parse `req.params`/`req.query` dung theo request URL.
  - API lookup da dung `getByName` (thay vi `get`) de doc record theo ten chinh xac.

## 3. Luong UI/UX
1. Khi mo page:
- Tu dong goi API lay workspace list.
- Sidebar o che do danh sach workspace.

2. Chon workspace:
- Sidebar doi sang che do prompt list.
- Hien nut Back de quay lai workspace list.
- Content hien form workspace (che do edit) + thong tin prompt.

3. CRUD workspace:
- Create: tai form, che do `create`, submit goi `createWorkspace`.
- Update: khi da chon workspace, submit goi `updateWorkspace`.
- Delete: chi kha dung khi dang chon workspace.
- Sau moi thao tac thanh cong: refresh list va dong bo state UI.

4. Prompt generator:
- Chon prompt trong sidebar.
- Parse token tu prompt text.
- Render input theo tung token.
- Generated prompt la ket qua thay the token bang gia tri nguoi dung nhap.

## 4. Quy tac parse token
Dinh dang token:
- `${Label|options:English,Japan}` -> render select box.
- `${Design JSON|textarea}` -> render textarea.
- `${Any Label|something-else}` -> fallback input text.

Chi tiet:
- Regex: `\$\{([^}|]+)\|([^}]+)\}`
- `label`: phan ben trai dau `|`.
- `descriptor`: phan ben phai dau `|`.
- Neu descriptor bat dau bang `options:` thi tach option theo dau phay.
- Neu descriptor la `textarea` (khong phan biet hoa thuong) thi tao textarea.
- Nguoc lai tao input text.

## 5. State chinh trong WorkspacesPage
- `workspaceList`: danh sach workspace.
- `selectedWorkspaceName`: workspace dang mo trong sidebar.
- `selectedWorkspace`: chi tiet workspace hien tai.
- `selectedPromptName`: prompt dang chon.
- `promptInputValues`: map gia tri input theo token id.
- `workspaceForm`: du lieu form workspace.
- `editingMode`: `create` | `edit`.
- Cac state loading/error de hien thi trang thai.

## 6. Responsive va giao dien
- Layout desktop: 2 cot (sidebar + content).
- Mobile (<=900px): sidebar len tren, content xuong duoi.
- Mau sac: tong nen am, card sang, accent xanh reu de de phan biet trang thai active.

## 7. Gioi han va huong mo rong
- Hien tai page chi CRUD workspace, chua CRUD prompt.
- Prompt text duoc lay uu tien tu `content/template/prompt/description` de phu hop du lieu thuc te khac nhau.
- Co the mo rong them:
  - Copy generated prompt.
  - Validate token bat buoc.
  - Luu preset input cho moi prompt.
