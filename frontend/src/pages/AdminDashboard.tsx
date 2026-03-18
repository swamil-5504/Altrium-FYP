import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { IUser } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Alert } from "../components/ui/Alert";
import { Textarea } from "../components/ui/Textarea";
import { Skeleton } from "../components/ui/Skeleton";

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    issued_to_id: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchCredentials();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/users");
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCredentials = async () => {
    try {
      const response = await axios.get("/credentials");
      setCredentials(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch credentials");
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post("/credentials", formData);
      setSuccess("Credential created successfully!");
      setFormData({ title: "", description: "", issued_to_id: "" });
      fetchCredentials();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create credential");
    }
  };

  const handleApproveCredential = async (credentialId: string) => {
    try {
      await axios.patch(`/credentials/${credentialId}/status`, { status: "APPROVED" });
      setSuccess("Credential approved!");
      fetchCredentials();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to approve credential");
    }
  };

  const handleRejectCredential = async (credentialId: string) => {
    try {
      await axios.patch(`/credentials/${credentialId}/status`, { status: "REJECTED" });
      setSuccess("Credential rejected!");
      fetchCredentials();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reject credential");
    }
  };

  const students = users.filter((u) => u.role === "STUDENT");

  if (loadingUsers || loadingCredentials) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
{(error || success) && (
        <div className={`p-4 rounded-lg border ${error ? 'border-destructive bg-destructive/5 text-destructive' : 'border-success bg-success/5 text-success'}`}>
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Credential Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Credential</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCredential} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Degree in Computer Science"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course details, GPA, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">Assign to Student</Label>
                <Select
                  id="student"
                  value={formData.issued_to_id}
                  onChange={(e) => setFormData({ ...formData, issued_to_id: e.target.value })}
                  required
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </option>
                  ))}
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Create Credential
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Users ({users.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{user.full_name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={user.role === 'ADMIN' ? 'secondary' : 'default'}>
                  {user.role}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Credentials Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Credentials ({credentials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No credentials created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell className="font-medium">{cred.title}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            cred.status === "APPROVED" ? "default" :
                            cred.status === "REJECTED" ? "destructive" : "secondary"
                          }
                        >
                          {cred.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {cred.status === "PENDING" && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveCredential(cred.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectCredential(cred.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
