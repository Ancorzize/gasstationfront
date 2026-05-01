import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./features/auth/LoginPage";
import { MainLayout } from "./layouts/MainLayout";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { UserListPage } from "./features/users/UserListPage";
import { RolePage } from "./features/admin/RolePage";
import { ToastProvider } from "./context/ToastContext";
import { ClientListPage } from "./features/clients/pages/ClientListPage";
import { SupplierListPage } from "./features/suppliers/pages/SupplierListPage";
import { BrandListPage } from "./features/brands/pages/BrandListPage";
import { CategoryListPage } from "./features/categories/pages/CategoryListPage";
import { UnitListPage } from "./features/units/pages/UnitListPage";
import { ProductListPage } from "./features/products/pages/ProductListPage";
import { ServiceListPage } from "./features/services/pages/ServiceListPage";
import { CompanySettingsPage } from "./features/settings/pages/CompanySettingsPage";
import { ProfilePage } from "./features/profile/pages/ProfilePage";
import { WarehouseListPage } from "./features/warehouses/pages/WarehouseListPage";
import { InventoryMovementsPage } from "./features/inventory/pages/InventoryMovementsPage";
import { StockStatusPage } from "./features/inventory/pages/StockStatusPage";
import { PurchaseListPage } from "./features/purchases/pages/PurchaseListPage";
import { PurchaseFormPage } from "./features/purchases/pages/PurchaseFormPage";
import { PurchaseDetailPage } from "./features/purchases/pages/PurchaseDetailPage";
import { CashSessionPage } from "./features/cash/pages/CashSessionPage";
import { ExpenseListPage } from "./features/expenses/pages/ExpenseListPage";
import { ExpenseCategoryPage } from "./features/expenses/pages/ExpenseCategoryPage";
import { PurchasePaymentListPage } from "./features/purchases/pages/PurchasePaymentListPage";
import { PurchasePaymentDetailPage } from "./features/purchases/pages/PurchasePaymentDetailPage";
import { CashHistoryPage } from "./features/cash/components/CashHistoryPage";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            }
          />

          <Route
            path="/usuarios"
            element={
              <MainLayout>
                <UserListPage />
              </MainLayout>
            }
          />

          <Route
            path="/roles"
            element={
              <MainLayout>
                <RolePage />
              </MainLayout>
            }
          />

          <Route
            path="/clientes"
            element={
              <MainLayout>
                <ClientListPage />
              </MainLayout>
            }
          />

          <Route
            path="/proveedores"
            element={
              <MainLayout>
                <SupplierListPage />
              </MainLayout>
            }
          />

          <Route
            path="/marcas"
            element={
              <MainLayout>
                <BrandListPage />
              </MainLayout>
            }
          />

          <Route
            path="/categorias"
            element={
              <MainLayout>
                <CategoryListPage />
              </MainLayout>
            }
          />

          <Route
            path="/unidades-medida"
            element={
              <MainLayout>
                <UnitListPage />
              </MainLayout>
            }
          />

          <Route
            path="/productos"
            element={
              <MainLayout>
                <ProductListPage />
              </MainLayout>
            }
          />

          <Route
            path="/servicios"
            element={
              <MainLayout>
                <ServiceListPage />
              </MainLayout>
            }
          />

          <Route
            path="/configuracion"
            element={
              <MainLayout>
                <CompanySettingsPage />
              </MainLayout>
            }
          />

          <Route
            path="/perfil"
            element={
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            }
          />

          <Route
            path="/bodegas"
            element={
              <MainLayout>
                <WarehouseListPage />
              </MainLayout>
            }
          />

          <Route
            path="/inventario/movimientos"
            element={
              <MainLayout>
                <InventoryMovementsPage />
              </MainLayout>
            }
          />

          <Route
            path="/inventario/existencias"
            element={
              <MainLayout>
                <StockStatusPage />
              </MainLayout>
            }
          />

          <Route
            path="/compras"
            element={
              <MainLayout>
                <PurchaseListPage />
              </MainLayout>
            }
          />
          <Route
            path="/compras/nueva"
            element={
              <MainLayout>
                <PurchaseFormPage />
              </MainLayout>
            }
          />
          <Route
            path="/compras/editar/:id"
            element={
              <MainLayout>
                <PurchaseFormPage />
              </MainLayout>
            }
          />
          <Route
            path="/compras/:id"
            element={
              <MainLayout>
                <PurchaseDetailPage />
              </MainLayout>
            }
          />

          <Route
            path="/caja"
            element={
              <MainLayout>
                <CashSessionPage />
              </MainLayout>
            }
          />
          <Route
            path="/gastos"
            element={
              <MainLayout>
                <ExpenseListPage />
              </MainLayout>
            }
          />
          <Route
            path="/gastos/categorias"
            element={
              <MainLayout>
                <ExpenseCategoryPage />
              </MainLayout>
            }
          />

          <Route
            path="/pagos-compra"
            element={
              <MainLayout>
                <PurchasePaymentListPage />
              </MainLayout>
            }
          />

          <Route
            path="/pagos-compra/:id"
            element={
              <MainLayout>
                <PurchasePaymentDetailPage />
              </MainLayout>
            }
          />

          <Route
            path="/caja/historico"
            element={
              <MainLayout>
                <CashHistoryPage />
              </MainLayout>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
