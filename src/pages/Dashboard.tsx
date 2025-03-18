
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VisaApplication } from '@/types/application';
import { getVisaApplications } from '@/services/applicationService';
import { 
  PlusCircle, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  ArrowRight 
} from 'lucide-react';

const Dashboard = () => {
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    const loadApplications = () => {
      const appData = getVisaApplications();
      setApplications(appData);
      if (!loaded) setLoaded(true);
    };
    
    loadApplications();
    
    // Set up an interval to refresh data
    const intervalId = setInterval(loadApplications, 5000);
    
    return () => clearInterval(intervalId);
  }, [loaded]);
  
  const getStatusIcon = (status: VisaApplication['status']) => {
    switch (status) {
      case 'documents_received':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_process':
        return <Clock className="h-5 w-5 text-travel-yellow" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-travel-yellow" />;
    }
  };
  
  const getStatusBadgeClass = (status: VisaApplication['status']) => {
    switch (status) {
      case 'documents_received':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_process':
        return 'bg-travel-accent text-travel-darkYellow dark:bg-amber-900/30 dark:text-amber-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'documents_requested':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col-reverse md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage visa applications and document collection
          </p>
        </div>
        <Button asChild className="mb-4 md:mb-0 bg-travel-yellow hover:bg-travel-darkYellow">
          <Link to="/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Application
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.length > 0 ? (
          applications.map((app, index) => (
            <Card 
              key={app.id} 
              className={`travel-card hover-lift staggered-item opacity-0 ${loaded ? 'animate-fade-in' : ''}`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{app.customerName}</CardTitle>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(app.status)}`}>
                    {getStatusIcon(app.status)}
                    <span className="ml-1.5">{getStatusText(app.status)}</span>
                  </span>
                </div>
                <CardDescription>
                  UAE Visa Application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4 text-travel-yellow">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    {formatDate(app.startDate)} - {formatDate(app.endDate)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2 flex justify-between items-center p-3 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{formatDate(app.created)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full group hover:bg-travel-yellow hover:text-white transition-all duration-300"
                >
                  <Link to={`/application/${app.id}`}>
                    <span>View Details</span>
                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center py-16 animate-fade-in">
            <div className="mx-auto bg-travel-accent rounded-full p-4 w-16 h-16 flex items-center justify-center mb-6">
              <FileText className="h-7 w-7 text-travel-yellow animate-bounce" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first visa application to get started tracking documents and managing the visa process
            </p>
            <Button asChild className="bg-travel-yellow hover:bg-travel-darkYellow">
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
