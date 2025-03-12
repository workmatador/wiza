
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VisaApplication } from '@/types/application';
import { getVisaApplications } from '@/services/applicationService';
import { PlusCircle, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  
  useEffect(() => {
    const loadApplications = () => {
      const appData = getVisaApplications();
      setApplications(appData);
    };
    
    loadApplications();
    
    // Set up an interval to refresh data
    const intervalId = setInterval(loadApplications, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const getStatusIcon = (status: VisaApplication['status']) => {
    switch (status) {
      case 'documents_received':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_process':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-travel-blue" />;
    }
  };
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const getStatusText = (status: VisaApplication['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'documents_requested':
        return 'Documents Requested';
      case 'documents_received':
        return 'Documents Received';
      case 'in_process':
        return 'In Process';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col-reverse md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage visa applications and document collection
          </p>
        </div>
        <Button asChild className="mb-4 md:mb-0">
          <Link to="/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Application
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.length > 0 ? (
          applications.map((app) => (
            <Card key={app.id} className="travel-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{app.customerName}</CardTitle>
                  {getStatusIcon(app.status)}
                </div>
                <CardDescription>
                  UAE Visa Application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Travel Dates:</div>
                  <div>
                    {formatDate(app.startDate)} - {formatDate(app.endDate)}
                  </div>
                  <div className="text-muted-foreground">Status:</div>
                  <div>{getStatusText(app.status)}</div>
                  <div className="text-muted-foreground">Created:</div>
                  <div>{formatDate(app.created)}</div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="outline" asChild className="w-full">
                  <Link to={`/application/${app.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <div className="mx-auto bg-muted rounded-full p-3 w-12 h-12 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No Applications Yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Create your first visa application to get started
            </p>
            <Button asChild>
              <Link to="/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Application
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
