import { Switch, Route, Redirect, useLocation } from "wouter";
import { lazy, Suspense } from 'react';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginRoute } from '@/lib/authSession';
const NotFound = lazy(() => import('@/pages/not-found'));
import Landing from "@/pages/landing-redesigned";
const PublicPages = lazy(() => import('@/pages/public-pages'));
const Intelligence = lazy(() => import('@/pages/admin/intelligence'));
const LoginNew = lazy(() => import('@/pages/login-new'));
const SignupNew = lazy(() => import('@/pages/signup-new'));
const DebugTest = lazy(() => import('@/pages/debug-test'));
const EmailDemo = lazy(() => import('@/pages/email-demo'));
const CustomerHome = lazy(() => import('@/pages/customer/home'));
const CustomerShop = lazy(() => import('@/pages/customer/shop'));
const CustomerOrders = lazy(() => import('@/pages/customer/orders'));
const CustomerOrderDetail = lazy(() => import('@/pages/customer/order-detail'));
const CustomerPrescriptions = lazy(() => import('@/pages/customer/prescriptions'));
const CustomerProfile = lazy(() => import('@/pages/customer/profile'));
const ProfileEditPage = lazy(() => import('@/pages/customer/profile-edit'));
const CartPage = lazy(() => import('@/pages/customer/cart'));
const CheckoutPage = lazy(() => import('@/pages/customer/checkout'));
const ConsultationsPage = lazy(() => import('@/pages/customer/consultations'));
const RoleTester = lazy(() => import('@/pages/role-tester'));
const RoleTestDashboard = lazy(() => import('@/pages/role-test-dashboard'));
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard'));
const AdminInventory = lazy(() => import('@/pages/admin/inventory'));
const AdminUsersPage = lazy(() => import('@/pages/admin/users'));
const AdminBranches = lazy(() => import('@/pages/admin/branches'));
const AdminProducts = lazy(() => import('@/pages/admin/products'));
const AdminOrders = lazy(() => import('@/pages/admin/orders'));
const AdminAnalytics = lazy(() => import('@/pages/admin/analytics'));
const AdminContent = lazy(() => import('@/pages/admin/content'));
const AdminSettings = lazy(() => import('@/pages/admin/settings'));
const PharmacistDashboard = lazy(() => import('@/pages/pharmacist/dashboard-new'));
const PharmacistPrescriptions = lazy(() => import('@/pages/pharmacist/prescriptions'));
const PharmacistInventory = lazy(() => import('@/pages/pharmacist/inventory'));
const StaffDashboard = lazy(() => import('@/pages/staff/dashboard-new'));
const StaffOrders = lazy(() => import('@/pages/staff/orders'));
const DriverDashboard = lazy(() => import('@/pages/driver/dashboard-new'));
const DriverHistory = lazy(() => import('@/pages/driver/history'));
const POSPage = lazy(() => import('@/pages/pos'));
const NationalIDVerification = lazy(() => import('@/pages/verification/national-id'));
const FaceScanVerification = lazy(() => import('@/pages/verification/face-scan'));
const PhoneOTPVerification = lazy(() => import('@/pages/verification/phone-otp'));
const DriverPerformance = lazy(() => import('@/pages/performance/driver-performance'));
const PharmacistPerformance = lazy(() => import('@/pages/performance/pharmacist-performance'));
const StaffPerformance = lazy(() => import('@/pages/performance/staff-performance'));
const AdminPerformance = lazy(() => import('@/pages/performance/admin-performance'));
const AccountSettings = lazy(() => import('@/pages/settings/account-settings'));
const DriverPortfolio = lazy(() => import('@/pages/portfolio/driver-portfolio'));
const PharmacistPortfolio = lazy(() => import('@/pages/portfolio/pharmacist-portfolio'));
const CustomerPortfolioProfile = lazy(() => import('@/pages/portfolio/customer-profile'));
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-2 border-b">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { user, isAuthenticated, isLoading, isCustomer, isAdmin, isPharmacist, isStaff, isDriver } = useAuth();
  const [location] = useLocation();

  if (location === '/welcome') return <Landing />;
  if (['/services', '/catalogue', '/branches', '/about', '/help', '/contact', '/privacy', '/terms', '/updates'].includes(location) || location.startsWith('/updates/')) return <PublicPages />;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (isAuthenticated && ['/login','/signup','/sign-in','/sign-up'].includes(location)) return <Redirect to={getPostLoginRoute(user!.role)} />;

  // Not authenticated - show landing/login
  if (!isAuthenticated) {
    return (
      <Switch>
        {import.meta.env.DEV && <Route path="/debug" component={DebugTest} />}
        {import.meta.env.DEV && <Route path="/email-demo" component={EmailDemo} />}
        <Route path="/" component={Landing} />
        <Route path="/login" component={LoginNew} />
        <Route path="/signup" component={SignupNew} />
        <Route path="/sign-in" component={LoginNew} />
        <Route path="/sign-up" component={SignupNew} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  // Verification routes (accessible to all authenticated users)
  const verificationRoutes = (
    <>
      <Route path="/verification/national-id" component={NationalIDVerification} />
      <Route path="/verification/face-scan" component={FaceScanVerification} />
      <Route path="/verification/phone-otp" component={PhoneOTPVerification} />
    </>
  );

  // Performance routes (role-based)
  const performanceRoutes = (
    <>
      {isDriver && <Route path="/performance/driver" component={DriverPerformance} />}
      {isPharmacist && <Route path="/performance/pharmacist" component={PharmacistPerformance} />}
      {isStaff && <Route path="/performance/staff" component={StaffPerformance} />}
      {isAdmin && <Route path="/performance/admin" component={AdminPerformance} />}
      <Route path="/pharmacist/inventory">
        {isPharmacist || isAdmin ? <AdminLayout><PharmacistInventory /></AdminLayout> : <NotFound />}
      </Route>
      <Route path="/pharmacist/prescriptions">
        {isPharmacist || isAdmin ? <AdminLayout><PharmacistPrescriptions /></AdminLayout> : <NotFound />}
      </Route>
      <Route path="/staff/orders">
        {isStaff || isAdmin ? <AdminLayout><StaffOrders /></AdminLayout> : <NotFound />}
      </Route>
      <Route path="/driver/history">
        {isDriver || isAdmin ? <AdminLayout><DriverHistory /></AdminLayout> : <NotFound />}
      </Route>
    </>
  );

  // Account & Portfolio routes (accessible to all authenticated users)
  const accountRoutes = (
    <>
      <Route path="/settings/account" component={AccountSettings} />
      {isDriver && <Route path="/portfolio/driver" component={DriverPortfolio} />}
      {isPharmacist && <Route path="/portfolio/pharmacist" component={PharmacistPortfolio} />}
      {isCustomer && <Route path="/profile/view" component={CustomerPortfolioProfile} />}
    </>
  );

  // Customer routes
  if (isCustomer) {
    return (
      <>
        <Switch>
          <Route path="/" component={CustomerHome} />
          <Route path="/shop" component={CustomerShop} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/orders" component={CustomerOrders} />
          <Route path="/orders/:id" component={CustomerOrderDetail} />
          <Route path="/prescriptions" component={CustomerPrescriptions} />
          <Route path="/consultations" component={ConsultationsPage} />
          <Route path="/profile" component={CustomerProfile} />
          <Route path="/profile/edit" component={ProfileEditPage} />
          {import.meta.env.DEV && <Route path="/role-tester" component={RoleTester} />}
          {import.meta.env.DEV && <Route path="/role-test" component={RoleTestDashboard} />}
          {verificationRoutes}
          {performanceRoutes}
          {accountRoutes}
          <Route path="/performance/customer" component={CustomerPortfolioProfile} />
          <Route component={NotFound} />
        </Switch>
      </>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/pos">{isStaff || isAdmin || isPharmacist ? <POSPage /> : <NotFound />}</Route>
        {/* Role tester accessible to all non-customer authenticated users */}
        {import.meta.env.DEV && <Route path="/role-tester" component={RoleTester} />}
        {import.meta.env.DEV && <Route path="/role-test" component={RoleTestDashboard} />}
        {(isAdmin || isPharmacist) && <Route path="/intelligence"><AdminLayout><Suspense fallback={<p>Loading planning tools…</p>}><Intelligence /></Suspense></AdminLayout></Route>}
        <Route path="/settings/account" component={AccountSettings} />
        
        {isAdmin && (
        <>
          <Route path="/admin">
            <AdminLayout><AdminDashboard /></AdminLayout>
          </Route>
          <Route path="/admin/dashboard">
            <AdminLayout><AdminDashboard /></AdminLayout>
          </Route>
          <Route path="/admin/branches">
            <AdminLayout><AdminBranches /></AdminLayout>
          </Route>
          <Route path="/admin/products">
            <AdminLayout><AdminProducts /></AdminLayout>
          </Route>
          <Route path="/admin/orders">
            <AdminLayout><AdminOrders /></AdminLayout>
          </Route>
          <Route path="/admin/analytics">
            <AdminLayout><AdminAnalytics /></AdminLayout>
          </Route>
          <Route path="/admin/content">
            <AdminLayout><AdminContent /></AdminLayout>
          </Route>
          <Route path="/admin/settings">
            <AdminLayout><AdminSettings /></AdminLayout>
          </Route>
          <Route path="/admin/inventory">
            <AdminLayout><AdminInventory /></AdminLayout>
          </Route>
          <Route path="/admin/users">
            <AdminLayout><AdminUsersPage /></AdminLayout>
          </Route>
          <Route path="/performance/admin">
            <AdminLayout><AdminPerformance /></AdminLayout>
          </Route>
          <Route path="/performance/admin">
            <AdminLayout><AdminPerformance /></AdminLayout>
          </Route>
        </>
      )}
      {isPharmacist && (
        <>
          <Route path="/pharmacist">
            <AdminLayout><PharmacistDashboard /></AdminLayout>
          </Route>
          <Route path="/pharmacist/dashboard">
            <AdminLayout><PharmacistDashboard /></AdminLayout>
          </Route>
          <Route path="/pharmacist/inventory">
            <AdminLayout><PharmacistInventory /></AdminLayout>
          </Route>
          <Route path="/pharmacist/prescriptions">
            <AdminLayout><PharmacistPrescriptions /></AdminLayout>
          </Route>
          <Route path="/performance/pharmacist">
            <AdminLayout><PharmacistPerformance /></AdminLayout>
          </Route>
          <Route path="/portfolio/pharmacist">
            <AdminLayout><PharmacistPortfolio /></AdminLayout>
          </Route>
        </>
      )}
      {isStaff && (
        <>
          <Route path="/staff">
            <AdminLayout><StaffDashboard /></AdminLayout>
          </Route>
          <Route path="/staff/dashboard">
            <AdminLayout><StaffDashboard /></AdminLayout>
          </Route>
          <Route path="/staff/orders">
            <AdminLayout><StaffOrders /></AdminLayout>
          </Route>
          <Route path="/performance/staff">
            <AdminLayout><StaffPerformance /></AdminLayout>
          </Route>
          <Route path="/pos" component={POSPage} />
        </>
      )}
      {isDriver && (
        <>
          <Route path="/driver">
            <AdminLayout><DriverDashboard /></AdminLayout>
          </Route>
          <Route path="/driver/dashboard">
            <AdminLayout><DriverDashboard /></AdminLayout>
          </Route>
          <Route path="/driver/history">
            <AdminLayout><DriverHistory /></AdminLayout>
          </Route>
          <Route path="/performance/driver">
            <AdminLayout><DriverPerformance /></AdminLayout>
          </Route>
          <Route path="/portfolio/driver">
            <AdminLayout><DriverPortfolio /></AdminLayout>
          </Route>
        </>
      )}
      
      {/* Default route based on role */}
      <Route path="/">
        {isAdmin ? (
          <AdminLayout><AdminDashboard /></AdminLayout>
        ) : isPharmacist ? (
          <AdminLayout><PharmacistDashboard /></AdminLayout>
        ) : isStaff ? (
          <AdminLayout><StaffDashboard /></AdminLayout>
        ) : isDriver ? (
          <AdminLayout><DriverDashboard /></AdminLayout>
        ) : (
          <NotFound />
        )}
      </Route>
      {verificationRoutes}
      {accountRoutes}
      <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <Toaster />
              <OfflineIndicator />
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center" role="status">Loading Thandizo…</div>}><Router /></Suspense>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
