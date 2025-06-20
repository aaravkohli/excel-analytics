import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Activity, Search, Ban, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getAllUsers, updateUser, getUserStats, getActivityStats, getStorageStats, getPendingAdmins, approveAdmin, rejectAdmin } from "@/utils/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface PendingAdmin {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  adminApplication?: {
    status: string;
    reason?: string;
    details?: string;
    reviewedAt?: string;
  };
}

export const AdminPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [activity, setActivity] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Admin Applications State
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId being acted on

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    setLoadingUsers(true);
    setUserError(null);
    getAllUsers(token)
      .then(res => setUsers(res.data.users))
      .catch(e => setUserError(e.message || 'Failed to load users'))
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    setLoadingStats(true);
    setStatsError(null);
    getUserStats(token)
      .then(res => setStats(res.data.stats))
      .catch(e => setStatsError(e.message || 'Failed to load stats'))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    setLoadingActivity(true);
    setActivityError(null);
    getActivityStats(token)
      .then(res => setActivity(res.data))
      .catch(e => setActivityError(e.message || 'Failed to load activity'))
      .finally(() => setLoadingActivity(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined;
    setLoadingPending(true);
    setPendingError(null);
    getPendingAdmins(token)
      .then(res => setPendingAdmins(res.data.users))
      .catch(e => setPendingError(e.message || 'Failed to load pending admins'))
      .finally(() => setLoadingPending(false));
  }, []);

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const token = localStorage.getItem('token') || undefined;
      const user = users.find(u => u._id === userId);
      if (!user) return;
      const updated = await updateUser(userId, { active: action === 'activated' }, token);
      setUsers(users => users.map(u => u._id === userId ? { ...u, active: updated.data.user.active } : u));
      toast.success(`User ${action} successfully`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update user');
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId + '-approve');
    try {
      const token = localStorage.getItem('token') || undefined;
      await approveAdmin(userId, token);
      setPendingAdmins(pendingAdmins => pendingAdmins.filter(u => u._id !== userId));
      toast.success('Admin application approved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId + '-reject');
    try {
      const token = localStorage.getItem('token') || undefined;
      await rejectAdmin(userId, token);
      setPendingAdmins(pendingAdmins => pendingAdmins.filter(u => u._id !== userId));
      toast.success('Admin application rejected');
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (active: boolean) => {
    return active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  // Stats parsing
  const totalUsers = Array.isArray(stats) ? stats.reduce((sum, s) => sum + (s.numUsers || 0), 0) : 0;
  const adminStats = Array.isArray(stats) ? stats.find((s: any) => s._id === 'admin') : null;
  const userStats = Array.isArray(stats) ? stats.find((s: any) => s._id === 'user') : null;

  // Activity parsing
  const recentUploads = activity?.fileStats || [];
  const recentAnalyses = activity?.analysisStats || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            Admin Dashboard
          </CardTitle>
          <CardDescription>
            Monitor users, system activity, and platform analytics
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{loadingStats ? '...' : totalUsers}</p>
                <p className="text-sm text-green-600">{adminStats ? `${adminStats.numUsers} admins` : ''}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regular Users</p>
                <p className="text-3xl font-bold text-gray-900">{loadingStats ? '...' : userStats ? userStats.numUsers : 0}</p>
                <p className="text-sm text-gray-500">Active now: {loadingUsers ? '...' : users.filter(u => u.active).length}</p>
              </div>
              <Activity className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-3xl font-bold text-gray-900">{loadingStats ? '...' : adminStats ? adminStats.numUsers : 0}</p>
                <p className="text-sm text-gray-500">System roles</p>
              </div>
              <div className="h-12 w-12 text-purple-600 flex items-center justify-center text-2xl font-bold">
                🛡️
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="admin-apps">Admin Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
              ) : userError ? (
                <div className="text-center py-8 text-red-500">{userError}</div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user._id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.active)}>
                              {user.active ? 'active' : 'suspended'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {user.active ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user._id, 'suspended')}
                                >
                                  <Ban className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserAction(user._id, 'activated')}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Monitor recent uploads and analyses across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActivity ? (
                <div className="text-center py-8 text-gray-500">Loading activity...</div>
              ) : activityError ? (
                <div className="text-center py-8 text-red-500">{activityError}</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Recent Uploads</h4>
                    <ul className="list-disc ml-6 text-sm">
                      {recentUploads.map((item: any, idx: number) => (
                        <li key={idx}>{item.uploads} uploads on {item._id}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Recent Analyses</h4>
                    <ul className="list-disc ml-6 text-sm">
                      {recentAnalyses.map((item: any, idx: number) => (
                        <li key={idx}>{item.analyses} analyses on {item._id}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Platform Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="font-medium">{loadingStats ? '...' : totalUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Admins</span>
                    <span className="font-medium">{loadingStats ? '...' : adminStats ? adminStats.numUsers : 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Regular Users</span>
                    <span className="font-medium">{loadingStats ? '...' : userStats ? userStats.numUsers : 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">API Status: Healthy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Database: Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">Storage: 80% capacity</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="admin-apps" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Pending Admin Applications</CardTitle>
              <CardDescription>
                Review and approve or reject admin access requests from users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="text-center py-8 text-gray-500">Loading applications...</div>
              ) : pendingError ? (
                <div className="text-center py-8 text-red-500">{pendingError}</div>
              ) : pendingAdmins.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No pending admin applications.</div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Application</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAdmins.map((user) => (
                        <TableRow key={user._id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate text-sm text-gray-600">
                              {user.adminApplication?.details || user.adminApplication?.reason || '—'}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoading === user._id + '-approve'}
                                onClick={() => handleApprove(user._id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoading === user._id + '-reject'}
                                onClick={() => handleReject(user._id)}
                              >
                                <Ban className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
