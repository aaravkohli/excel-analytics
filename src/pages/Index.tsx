import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/FileUpload";
import { DataPreview } from "@/components/DataPreview";
import { ChartGenerator } from "@/components/ChartGenerator";
import { UploadHistory } from "@/components/UploadHistory";
import { AdminPanel } from "@/components/AdminPanel";
import { AuthModal } from "@/components/AuthModal";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { BarChart3, Upload, History, Shield, Brain, FileSpreadsheet, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { login as apiLogin, uploadFile as apiUploadFile, getProfile as apiGetProfile } from "@/utils/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'demo'>('demo');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoModalContent, setDemoModalContent] = useState<'ai' | 'history' | null>(null);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiGetProfile(token)
        .then(res => {
          setIsAuthenticated(true);
          setUserRole(res.data.user.role || 'user');
        })
        .catch(() => {
          setIsAuthenticated(false);
          setUserRole('demo');
          localStorage.removeItem('token');
        });
    } else {
      setIsAuthenticated(false);
      setUserRole('demo');
    }
  }, []);

  const handleLogin = async (email: string, password: string, role: 'user' | 'admin' | 'demo' = 'user') => {
    try {
      if (role === 'demo') {
        setIsAuthenticated(true);
        setUserRole('demo');
        setShowAuthModal(false);
        toast.success('You are now in demo mode!');
        return;
      }
      const result = await apiLogin(email, password);
      const backendRole = result?.data?.user?.role || 'user';
      setIsAuthenticated(true);
      setUserRole(backendRole);
      setShowAuthModal(false);
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      toast.success(`Welcome back! Logged in as ${backendRole}`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('user');
    setUploadedData([]);
    setSelectedFile(null);
    setActiveTab("upload");
    localStorage.removeItem('token');
    toast.success("Logged out successfully");
  };

  const handleFileUpload = async (data: any[], file: File) => {
    try {
      const uploadRes = await apiUploadFile(file);
      const fileId = uploadRes?.data?.file?._id;
      if (!fileId) throw new Error("File ID not returned from server");
      setUploadedFileId(fileId);
      toast.success("File uploaded to server!");
      // Optionally, refresh upload history here
    } catch (e: any) {
      toast.error(e.message || "Failed to upload file to server.");
    }
    setUploadedData(data);
    setSelectedFile(file);
    setActiveTab("preview");
  };

  return (
    <>
      {isAuthenticated ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <Navigation
            userRole={userRole}
            onLogout={handleLogout}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
              <div className="flex justify-center">
                <TabsList className="grid w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl grid-cols-4 lg:grid-cols-5 h-10 sm:h-12 bg-white shadow-lg rounded-xl">
                  <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                    <Upload className="h-3 sm:h-4 w-3 sm:w-4" />
                    <span className="hidden sm:inline">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger value="preview" disabled={!uploadedData.length} className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white">
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="charts" disabled={!uploadedData.length} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                    <BarChart3 className="h-3 sm:h-4 w-3 sm:w-4" />
                    <span className="hidden sm:inline">Charts</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
                    <History className="h-3 sm:h-4 w-3 sm:w-4" />
                    <span className="hidden sm:inline">History</span>
                  </TabsTrigger>
                  {userRole === 'admin' && (
                    <TabsTrigger value="admin" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                      <Shield className="h-3 sm:h-4 w-3 sm:w-4" />
                      <span className="hidden lg:inline">Admin</span>
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="upload" className="space-y-6">
                <div className="max-w-4xl mx-auto">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Upload className="h-5 w-5" />
                        Upload Excel File
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Upload your Excel file (.xls, .xlsx) or CSV file to start analyzing your data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FileUpload onFileUpload={handleFileUpload} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <DataPreview data={uploadedData} fileName={selectedFile?.name} />
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                {userRole === 'demo' ? (
                  <div className="max-w-xl mx-auto text-center py-12">
                    <Dialog open={showDemoModal || demoModalContent === 'ai'} onOpenChange={(open) => { setShowDemoModal(open); if (!open) setDemoModalContent(null); }}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>AI Insights are for registered users</DialogTitle>
                          <DialogDescription>
                            Sign up or log in to unlock AI-powered insights and advanced charting features.
                          </DialogDescription>
                        </DialogHeader>
                        <Button onClick={() => {
                          setShowDemoModal(false);
                          setDemoModalContent(null);
                          setShowAuthModal(true);
                        }}>Login or Register</Button>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={() => { setShowDemoModal(true); setDemoModalContent('ai'); }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Unlock AI Insights</Button>
                  </div>
                ) : (
                  <ChartGenerator data={uploadedData} fileId={uploadedFileId} />
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                {userRole === 'demo' ? (
                  <div className="max-w-xl mx-auto text-center py-12">
                    <Dialog open={showDemoModal || demoModalContent === 'history'} onOpenChange={(open) => { setShowDemoModal(open); if (!open) setDemoModalContent(null); }}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload History is for registered users</DialogTitle>
                          <DialogDescription>
                            Sign up or log in to view your upload history and manage your files.
                          </DialogDescription>
                        </DialogHeader>
                        <Button onClick={() => {
                          setShowDemoModal(false);
                          setDemoModalContent(null);
                          setShowAuthModal(true);
                        }}>Login or Register</Button>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={() => { setShowDemoModal(true); setDemoModalContent('history'); }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Unlock Upload History</Button>
                  </div>
                ) : (
                  <UploadHistory userRole={userRole} />
                )}
              </TabsContent>

              {userRole === 'admin' && (
                <TabsContent value="admin" className="space-y-6">
                  <AdminPanel />
                </TabsContent>
              )}
            </Tabs>
          </div>
          <Footer />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full opacity-10 animate-pulse delay-500"></div>
          </div>
          <div className="container mx-auto px-4 py-8 sm:py-16 relative z-10">
            <div className="max-w-6xl mx-auto text-center">
              <div className="mb-8 sm:mb-12">
                <div className="inline-flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4 sm:mb-6 shadow-xl">
                  <BarChart3 className="h-8 sm:h-10 w-8 sm:w-10 text-white" />
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Excel Analytics 
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Platform</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                  Transform your Excel data into stunning visualizations with AI-powered insights. 
                  Create interactive 2D and 3D charts, get intelligent analysis, and discover hidden patterns in your data.
                </p>
              </div>

              {/* Main Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50">
                  <CardHeader className="text-center pb-6">
                    <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4 mx-auto">
                      <Upload className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">Smart Upload & Parse</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Drag & drop Excel files (.xls, .xlsx, .csv) for instant parsing with intelligent column detection and data validation
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-purple-50">
                  <CardHeader className="text-center pb-6">
                    <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mb-4 mx-auto">
                      <BarChart3 className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">Advanced Visualizations</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Create stunning 2D and 3D charts (Bar, Line, Pie, Scatter, Surface) with dynamic axis selection and real-time updates
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-indigo-50">
                  <CardHeader className="text-center pb-6">
                    <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full mb-4 mx-auto">
                      <Sparkles className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">AI-Powered Insights</CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Get intelligent analysis and insights from your data patterns, trends, and correlations with our advanced AI engine
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Secondary Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
                  <CardHeader className="text-center pb-4">
                    <FileSpreadsheet className="h-6 sm:h-8 w-6 sm:w-8 text-green-600 mb-2 mx-auto" />
                    <CardTitle className="text-base sm:text-lg">Smart Data Analysis</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Automatic column type detection, statistics calculation, and comprehensive data preview
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardHeader className="text-center pb-4">
                    <TrendingUp className="h-6 sm:h-8 w-6 sm:w-8 text-orange-600 mb-2 mx-auto" />
                    <CardTitle className="text-base sm:text-lg">Upload History</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Track your uploads, manage charts, and access historical data with detailed analytics
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100">
                  <CardHeader className="text-center pb-4">
                    <Shield className="h-6 sm:h-8 w-6 sm:w-8 text-red-600 mb-2 mx-auto" />
                    <CardTitle className="text-base sm:text-lg">Admin Dashboard</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Comprehensive user management, system analytics, and advanced administrative controls
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8 sm:mb-12 px-4">
                <Button
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto transform hover:scale-105 transition-all duration-200 shadow-xl"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get Started Free
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                  className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 h-auto border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transform hover:scale-105 transition-all duration-200"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Try Demo
                </Button>
              </div>

              {/* Features List */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Secure Authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Role-based Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>3D Visualizations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>AI Insights</span>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      )}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />
    </>
  );
};

export default Index;
