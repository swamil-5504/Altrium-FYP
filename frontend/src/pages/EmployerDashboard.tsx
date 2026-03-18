import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Skeleton } from "../components/ui/Skeleton";

const EmployerDashboard: React.FC = () => {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await axios.get("/credentials");
      setCredentials(response.data);
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCredentials =
    filter === "ALL"
      ? credentials
      : credentials.filter((c) => c.status === filter);

  const stats = {
    total: credentials.length,
    approved: credentials.filter((c) => c.status === "APPROVED").length,
    pending: credentials.filter((c) => c.status === "PENDING").length,
    rejected: credentials.filter((c) => c.status === "REJECTED").length,
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "APPROVED": return "default";
      case "PENDING": return "secondary";
      case "REJECTED": return "destructive";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CardHeader className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-0">
        <div>
          <CardTitle className="text-3xl font-bold">Credentials Directory</CardTitle>
          <p className="text-muted-foreground">Browse all available credentials (Read-only)</p>
        </div>
        <Button onClick={fetchCredentials} variant="outline">
          Refresh
        </Button>
      </CardHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-foreground mb-1">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Credentials</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 border-l-4 border-emerald-500 bg-emerald-50/50">
            <div className="text-3xl font-bold text-emerald-700 mb-1">{stats.approved}</div>
            <p className="text-sm text-emerald-700 font-medium">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 border-l-4 border-amber-500 bg-amber-50/50">
            <div className="text-3xl font-bold text-amber-700 mb-1">{stats.pending}</div>
            <p className="text-sm text-amber-700 font-medium">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 border-l-4 border-destructive bg-destructive/10">
            <div className="text-3xl font-bold text-destructive mb-1">{stats.rejected}</div>
            <p className="text-sm text-destructive font-medium">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-wrap gap-2">
            {["ALL", "APPROVED", "PENDING", "REJECTED"].map((status) => (
              <Button
                key={status}
                variant={filter === status ? "default" : "outline"}
                onClick={() => setFilter(status)}
                size="sm"
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credentials Table */}
      <Card>
        <CardContent>
          {filteredCredentials.length === 0 ? (
            <div className="text-center py-20">
              <Card className="inline-block p-12">
                <CardContent className="space-y-2">
                  <p className="text-2xl text-muted-foreground">No credentials match your filter</p>
                  <Button variant="outline" onClick={() => setFilter('ALL')}>
                    Show all
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Issued</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCredentials.map((credential) => (
                    <TableRow key={credential.id}>
                      <TableCell className="font-medium">{credential.title}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="line-clamp-2">{credential.description || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(credential.status) as any}>
                          {credential.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(credential.created_at).toLocaleDateString()}
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

export default EmployerDashboard;
