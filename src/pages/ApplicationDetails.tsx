import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getVisaApplicationById, getDocumentsForApplication } from '@/services/applicationService';
import { VisaApplication, Document } from '@/types/application';
import { PlaneTakeoff, Link as LinkIcon, Calendar, FileText, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OcrDataDisplay from '@/components/OcrDataDisplay';

const ApplicationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [application, setApplication] = useState<VisaApplication | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadData = () => {
      const app = getVisaApplicationById(id);
      if (app) {
        setApplication(app);
        setDocuments(getDocumentsForApplication(app.id));
      }
      setLoading(false);
    };

    loadData();
    
    const intervalId = setInterval(loadData, 5000);
    
    return () => clearInterval(intervalId);
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto text-center py-12">
        <p>Loading application details...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Application Not Found</h2>
        <p className="mb-6">The application you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    );
  }

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

  const getDocumentStatusText = (status: Document['status']) => {
    switch (status) {
      case 'pending':
        return 'Not Uploaded';
      case 'received':
        return 'Received';
      case 'rejected':
        return 'Rejected';
    }
  };

  const getDocumentStatusClass = (status: Document['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'received':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
    }
  };

  const copyShareableLink = () => {
    if (!application.shareableLink) return;
    
    const origin = window.location.origin;
    const fullLink = `${origin}${application.shareableLink}`;
    
    navigator.clipboard.writeText(fullLink).then(
      () => {
        setLinkCopied(true);
        toast({
          title: "Link copied",
          description: "Shareable link copied to clipboard"
        });
        
        setTimeout(() => {
          setLinkCopied(false);
        }, 2000);
      },
      () => {
        toast({
          title: "Failed to copy",
          description: "Could not copy link to clipboard",
          variant: "destructive"
        });
      }
    );
  };

  const openShareableLink = () => {
    if (!application.shareableLink) return;
    
    const origin = window.location.origin;
    const fullLink = `${origin}${application.shareableLink}`;
    window.open(fullLink, '_blank');
  };

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{application.customerName}'s Application</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          UAE Visa Application Details
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="travel-card mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <PlaneTakeoff className="h-5 w-5 text-travel-blue" />
                <CardTitle>Application Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-sm text-muted-foreground">Customer Name:</div>
                <div className="text-sm font-medium">{application.customerName}</div>
                
                <div className="text-sm text-muted-foreground">Travel Dates:</div>
                <div className="text-sm font-medium">
                  {formatDate(application.startDate)} - {formatDate(application.endDate)}
                </div>
                
                <div className="text-sm text-muted-foreground">Status:</div>
                <div className="text-sm font-medium">{getStatusText(application.status)}</div>
                
                <div className="text-sm text-muted-foreground">Created:</div>
                <div className="text-sm font-medium">{formatDate(application.created)}</div>
                
                <div className="text-sm text-muted-foreground">Last Updated:</div>
                <div className="text-sm font-medium">{formatDate(application.updated)}</div>
              </div>
            </CardContent>
          </Card>
          
          {application && <OcrDataDisplay application={application} />}
          
          <Card className="travel-card">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-travel-blue" />
                <CardTitle>Required Documents</CardTitle>
              </div>
              <CardDescription>
                Documents that need to be submitted for this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{doc.name}</div>
                      <div className={`text-sm ${getDocumentStatusClass(doc.status)}`}>
                        {getDocumentStatusText(doc.status)}
                      </div>
                    </div>
                    {doc.status === 'received' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="travel-card mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-5 w-5 text-travel-blue" />
                <CardTitle>Shareable Link</CardTitle>
              </div>
              <CardDescription>
                Share this link with your customer to collect their documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {application.shareableLink 
                    ? 'Click the buttons below to copy or open the shareable link:'
                    : 'No shareable link is available for this application.'}
                </div>
                
                {application.shareableLink && (
                  <div className="flex flex-col space-y-2">
                    <Button onClick={copyShareableLink} className="w-full" variant="outline">
                      <Copy className="mr-2 h-4 w-4" />
                      {linkCopied ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button onClick={openShareableLink} variant="secondary" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Link
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="travel-card">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-travel-blue" />
                <CardTitle>Application Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full w-3 h-3 bg-green-500 mt-1"></div>
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  <div>
                    <div className="font-medium">Application Created</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(application.created)}
                    </div>
                  </div>
                </div>
                
                {application.status !== 'pending' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full w-3 h-3 bg-green-500 mt-1"></div>
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    <div>
                      <div className="font-medium">Documents Requested</div>
                      <div className="text-sm text-muted-foreground">
                        Link shared with customer
                      </div>
                    </div>
                  </div>
                )}
                
                {application.status === 'documents_received' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full w-3 h-3 bg-green-500 mt-1"></div>
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                    <div>
                      <div className="font-medium">Documents Received</div>
                      <div className="text-sm text-muted-foreground">
                        All required documents uploaded
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start space-x-3 opacity-50">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full w-3 h-3 bg-gray-300 dark:bg-gray-600 mt-1"></div>
                  </div>
                  <div>
                    <div className="font-medium">Visa Processed</div>
                    <div className="text-sm text-muted-foreground">
                      Pending
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;
