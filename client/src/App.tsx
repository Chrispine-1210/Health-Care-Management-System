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
import SignOutPage from "@/pages/sign-out";
import BlogPage from "@/pages/blog";
import PartnersPage from "@/pages/partners";
import TeamPage from "@/pages/team";
import TestimonialsPage from "@/pages/testimonials";
import GalleryPage from "@/pages/gallery";
import CustomerHome from "@/pages/customer/home";
import CustomerShop from "@/pages/customer/shop";
import CustomerOrders from "@/pages/customer/orders";
import CustomerOrderDetail from "@/pages/customer/order-detail";
import CustomerPrescriptions from "@/pages/customer/prescriptions";
import CustomerProfile from "@/pages/customer/profile";
import ProfileEditPage from "@/pages/customer/profile-edit";
import CartPage from "@/pages/customer/cart";
import CheckoutPage from "@/pages/customer/checkout";
import ConsultationsPage from "@/pages/customer/consultations";
import NotificationsPage from "@/pages/NotificationsPage";
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
import PharmacistPrescriptionDetailPage from "@/pages/pharmacist/prescription-detail";
import PharmacistInventory from "@/pages/pharmacist/inventory";
import StaffDashboard from "@/pages/staff/dashboard-new";
import StaffOrders from "@/pages/staff/orders";
import DriverDashboard from "@/pages/driver/dashboard-new";
import DeliveryUpdatePage from "@/pages/driver/delivery-update";
import DriverHistory from "@/pages/driver/history";
import POSPage from "@/pages/pos";
import DriverOnboarding from "@/pages/onboarding/driver-onboarding";
import PharmacistOnboarding from "@/pages/onboarding/pharmacist-onboarding";
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
import { SeoManager } from "@/components/SeoManager";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { RoleRedirect } from "@/components/RoleRedirect";
import { canUsePointOfSale } from "@shared/roleCapabilities";

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
  const canAccessPointOfSale = canUsePointOfSale(user?.role);
  const dashboardTargets = {
    admin: "/admin",
    pharmacist: "/pharmacist",
    staff: "/staff",
    driver: "/driver",
    customer: "/customer",
  };

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
        <Route path="/" component={Landing} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/partners" component={PartnersPage} />
        <Route path="/team" component={TeamPage} />
        <Route path="/testimonials" component={TestimonialsPage} />
        <Route path="/gallery" component={GalleryPage} />
        <Route path="/login" component={LoginNew} />
        <Route path="/signup" component={SignupNew} />
        <Route path="/sign-in" component={LoginNew} />
        <Route path="/sign-up" component={SignupNew} />
        <Route path="/signout" component={SignOutPage} />
        <Route path="/sign-out" component={SignOutPage} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  if (user?.mustResetPassword) {
    return (
      <Switch>
        <Route path="/settings/account" component={AccountSettings} />
        <Route path="/signout" component={SignOutPage} />
        <Route path="/sign-out" component={SignOutPage} />
        <Route>
          <Redirect to="/settings/account" />
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
    </>
  );

  const onboardingRoutes = (
    <>
      {isDriver && <Route path="/onboarding/driver" component={DriverOnboarding} />}
      {isPharmacist && <Route path="/onboarding/pharmacist" component={PharmacistOnboarding} />}
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
          <Route path="/signout" component={SignOutPage} />
          <Route path="/sign-out" component={SignOutPage} />
          <Route path="/customer" component={CustomerHome} />
          <Route path="/customer/dashboard" component={CustomerHome} />
          <Route path="/dashboard">
            <RoleRedirect targets={dashboardTargets} />
          </Route>
          <Route path="/customer/shop" component={CustomerShop} />
          <Route path="/customer/cart" component={CartPage} />
          <Route path="/customer/checkout" component={CheckoutPage} />
          <Route path="/customer/notifications" component={NotificationsPage} />
          <Route path="/customer/orders/:id" component={CustomerOrderDetail} />
          <Route path="/customer/orders" component={CustomerOrders} />
          <Route path="/customer/prescriptions" component={CustomerPrescriptions} />
          <Route path="/customer/consultations" component={ConsultationsPage} />
          <Route path="/customer/profile/edit" component={ProfileEditPage} />
          <Route path="/customer/profile/view" component={CustomerPortfolioProfile} />
          <Route path="/customer/profile" component={CustomerProfile} />
          <Route path="/">
            <RoleRedirect targets={dashboardTargets} />
          </Route>
          <Route path="/shop" component={CustomerShop} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/notifications">
            <RoleRedirect targets={{ customer: "/customer/notifications" }} />
          </Route>
          <Route path="/orders" component={CustomerOrders} />
          <Route path="/orders/:id" component={CustomerOrderDetail} />
          <Route path="/prescriptions" component={CustomerPrescriptions} />
          <Route path="/consultations" component={ConsultationsPage} />
          <Route path="/profile" component={CustomerProfile} />
          <Route path="/profile/edit" component={ProfileEditPage} />
          {verificationRoutes}
          {performanceRoutes}
          {accountRoutes}
          <Route path="/performance/customer" component={CustomerPortfolioProfile} />
          <Route component={NotFound} />
        </Switch>
        <ChatWidget />
      </>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/signout" component={SignOutPage} />
        <Route path="/sign-out" component={SignOutPage} />
        {onboardingRoutes}
        <Route path="/pos">
          <RoleRedirect targets={{ admin: "/admin/pos", staff: "/staff/pos" }} />
        </Route>
        <Route path="/notifications">
          <RoleRedirect
            targets={{
              admin: "/admin/inbox",
              pharmacist: "/pharmacist/inbox",
              staff: "/staff/inbox",
              driver: "/driver/inbox",
              customer: "/customer/notifications",
            }}
          />
        </Route>
        <Route path="/dashboard">
          <RoleRedirect targets={dashboardTargets} />
        </Route>
        <Route path="/settings/account" component={AccountSettings} />
        
      {isAdmin && (
        <>
          {canAccessPointOfSale && <Route path="/admin/pos" component={POSPage} />}
          <Route path="/admin/inbox">
            <AdminLayout><NotificationsPage /></AdminLayout>
          </Route>
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
          <Route path="/admin/performance">
            <AdminLayout><AdminPerformance /></AdminLayout>
          </Route>
        </>
      )}
      {isPharmacist && (
        <>
          <Route path="/pharmacist/inbox">
            <AdminLayout><NotificationsPage /></AdminLayout>
          </Route>
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
          <Route path="/pharmacist/prescriptions/:id">
            <AdminLayout><PharmacistPrescriptionDetailPage /></AdminLayout>
          </Route>
          <Route path="/performance/pharmacist">
            <AdminLayout><PharmacistPerformance /></AdminLayout>
          </Route>
          <Route path="/pharmacist/performance">
            <AdminLayout><PharmacistPerformance /></AdminLayout>
          </Route>
          <Route path="/portfolio/pharmacist">
            <AdminLayout><PharmacistPortfolio /></AdminLayout>
          </Route>
          <Route path="/pharmacist/portfolio">
            <AdminLayout><PharmacistPortfolio /></AdminLayout>
          </Route>
        </>
      )}
      {isStaff && (
        <>
          {canAccessPointOfSale && <Route path="/staff/pos" component={POSPage} />}
          <Route path="/staff/inbox">
            <AdminLayout><NotificationsPage /></AdminLayout>
          </Route>
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
          <Route path="/staff/performance">
            <AdminLayout><StaffPerformance /></AdminLayout>
          </Route>
        </>
      )}
      {isDriver && (
        <>
          <Route path="/driver/inbox">
            <AdminLayout><NotificationsPage /></AdminLayout>
          </Route>
          <Route path="/driver">
            <AdminLayout><DriverDashboard /></AdminLayout>
          </Route>
          <Route path="/driver/dashboard">
            <AdminLayout><DriverDashboard /></AdminLayout>
          </Route>
          <Route path="/driver/history">
            <AdminLayout><DriverHistory /></AdminLayout>
          </Route>
          <Route path="/driver/deliveries/:id">
            <AdminLayout><DeliveryUpdatePage /></AdminLayout>
          </Route>
          <Route path="/performance/driver">
            <AdminLayout><DriverPerformance /></AdminLayout>
          </Route>
          <Route path="/driver/performance">
            <AdminLayout><DriverPerformance /></AdminLayout>
          </Route>
          <Route path="/portfolio/driver">
            <AdminLayout><DriverPortfolio /></AdminLayout>
          </Route>
          <Route path="/driver/portfolio">
            <AdminLayout><DriverPortfolio /></AdminLayout>
          </Route>
        </>
      )}
      
      <Route path="/">
        <RoleRedirect targets={dashboardTargets} />
      </Route>
      {verificationRoutes}
      {accountRoutes}
      <Route component={NotFound} />
      </Switch>
      <ChatWidget />
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
                <SeoManager />
                <OfflineIndicator />
                <Router />
                <CookieConsentBanner />
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
