import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing-redesigned";
import LoginNew from "@/pages/login-new";
import SignupNew from "@/pages/signup-new";
import DebugTest from "@/pages/debug-test";
import EmailDemo from "@/pages/email-demo";
import CustomerHome from "@/pages/customer/home";
import SignInDemo from "@/pages/auth/sign-in-updated";
import SignUp from "@/pages/auth/sign-up";
import CustomerShop from "@/pages/customer/shop";
import CustomerOrders from "@/pages/customer/orders";
import CustomerOrderDetail from "@/pages/customer/order-detail";
import CustomerPrescriptions from "@/pages/customer/prescriptions";
import CustomerProfile from "@/pages/customer/profile";
import ProfileEditPage from "@/pages/customer/profile-edit";
import CartPage from "@/pages/customer/cart";
import CheckoutPage from "@/pages/customer/checkout";
import ConsultationsPage from "@/pages/customer/consultations";
import RoleTester from "@/pages/role-tester";
import RoleTestDashboard from "@/pages/role-test-dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminInventory from "@/pages/admin/inventory";
import AdminUsersPage from "@/pages/admin/users";
import AdminBranches from "@/pages/admin/branches";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminContent from "@/pages/admin/content";
import AdminSettings from "@/pages/admin/settings";
import PharmacistDashboard from "@/pages/pharmacist/dashboard-new";
import PharmacistPrescriptions from "@/pages/pharmacist/prescriptions";
import PharmacistInventory from "@/pages/pharmacist/inventory";
import StaffDashboard from "@/pages/staff/dashboard-new";
import StaffOrders from "@/pages/staff/orders";
import DriverDashboard from "@/pages/driver/dashboard-new";
import DriverHistory from "@/pages/driver/history";
import POSPage from "@/pages/pos";
import NationalIDVerification from "@/pages/verification/national-id";
import FaceScanVerification from "@/pages/verification/face-scan";
import PhoneOTPVerification from "@/pages/verification/phone-otp";
import DriverPerformance from "@/pages/performance/driver-performance";
import PharmacistPerformance from "@/pages/performance/pharmacist-performance";
import StaffPerformance from "@/pages/performance/staff-performance";
import AdminPerformance from "@/pages/performance/admin-performance";
import AccountSettings from "@/pages/settings/account-settings";
import DriverPortfolio from "@/pages/portfolio/driver-portfolio";
import PharmacistPortfolio from "@/pages/portfolio/pharmacist-portfolio";
import CustomerPortfolioProfile from "@/pages/portfolio/customer-profile";
import { ChatWidget } from "@/components/ChatWidget";
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
  const { isAuthenticated, isLoading, isCustomer, isAdmin, isPharmacist, isStaff, isDriver } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // Not authenticated - show landing/login
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/debug" component={DebugTest} />
        <Route path="/email-demo" component={EmailDemo} />
        <Route path="/" component={Landing} />
        <Route path="/login" component={LoginNew} />
        <Route path="/signup" component={SignupNew} />
        <Route path="/sign-in" component={SignInDemo} />
        <Route path="/sign-up" component={SignUp} />
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
        <AdminLayout><PharmacistInventory /></AdminLayout>
      </Route>
      <Route path="/pharmacist/prescriptions">
        <AdminLayout><PharmacistPrescriptions /></AdminLayout>
      </Route>
      <Route path="/staff/orders">
        <AdminLayout><StaffOrders /></AdminLayout>
      </Route>
      <Route path="/driver/history">
        <AdminLayout><DriverHistory /></AdminLayout>
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

  // Online users for chat
  const onlineUsers = [
    { id: "driver-1", name: "Mthunzi", role: "driver", status: "online" as const },
    { id: "pharma-1", name: "Dr. Banda", role: "pharmacist", status: "online" as const },
    { id: "staff-1", name: "Gift", role: "staff", status: "online" as const },
    { id: "admin-1", name: "Admin", role: "admin", status: "online" as const },
  ];

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
          <Route path="/role-tester" component={RoleTester} />
          <Route path="/role-test" component={RoleTestDashboard} />
          {verificationRoutes}
          {performanceRoutes}
          {accountRoutes}
          <Route path="/performance/customer" component={CustomerPortfolioProfile} />
          <Route component={NotFound} />
        </Switch>
        <ChatWidget onlinUsers={onlineUsers} />
      </>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/pos" component={POSPage} />
        {/* Role tester accessible to all non-customer authenticated users */}
        <Route path="/role-tester" component={RoleTester} />
        <Route path="/role-test" component={RoleTestDashboard} />
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
          <AdminLayout><AdminDashboard /></AdminLayout>
        )}
      </Route>
      {verificationRoutes}
      {accountRoutes}
      <Route component={NotFound} />
      </Switch>
      <ChatWidget onlinUsers={onlineUsers} />
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
              <Router />
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
