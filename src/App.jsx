import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { UserListPage } from './features/users/UserListPage';
import { RolePage } from './features/admin/RolePage';
import { ToastProvider } from './context/ToastContext'; 
import { ClientListPage } from './features/clients/pages/ClientListPage';
import { SupplierListPage } from './features/suppliers/pages/SupplierListPage';
import { BrandListPage } from './features/brands/pages/BrandListPage';
import { CategoryListPage } from './features/categories/pages/CategoryListPage';
import { UnitListPage } from './features/units/pages/UnitListPage';

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

          <Route path="/proveedores" 
            element={
              <MainLayout>
                <SupplierListPage />
              </MainLayout>
            } 
          />

          <Route path="/marcas" 
            element={
            <MainLayout>
              <BrandListPage />
            </MainLayout>
          } 
          />

          <Route path="/categorias" 
            element={
            <MainLayout>
              <CategoryListPage />
            </MainLayout>
          } 
          />

          <Route path="/unidades-medida" 
            element={
            <MainLayout>
              <UnitListPage />
            </MainLayout>
          } />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;