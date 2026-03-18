import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";

const StudentDashboard: React.FC = () => {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');

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

  const filteredCredentials = credentials.filter((cred) => {
    if (filter === 'ALL') return true;
    return cred.status === filter;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "APPROVED": return "default" as const;
      case "REJECTED": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <CardTitle className="text-3xl font-bold">My Credentials</CardTitle>
          <p className="text-muted-foreground">View all your issued credentials</p>
        </div>
        <div className="flex gap-2">
          {(['ALL', 'APPROVED', 'PENDING'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              size="sm"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {filteredCredentials.length === 0 ? (
        <Card className="text-center py-20">
          <CardContent className="space-y-4">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">No credentials yet</h3>
              <p className="text-muted-foreground">
                Once an admin issues credentials to you, they will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCredentials.map((credential) => (
            <Card key={credential.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-xl text-foreground line-clamp-2">
                      {credential.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {credential.description}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(credential.status)}>
                    {credential.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
                  <span>Issued {new Date(credential.created_at).toLocaleDateString()}</span>
                  <Button variant="ghost" size="sm" onClick={fetchCredentials}>
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
