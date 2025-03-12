
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  PlaneTakeoff, 
  CheckCircle, 
  Upload, 
  FileUp, 
  FileText, 
  Calendar, 
  Mail, 
  Phone 
} from 'lucide-react';
import { 
  getVisaApplicationByToken, 
  getDocumentsForApplication, 
  updateDocumentStatus, 
  updateCustomerInfo, 
  getRequiredDocumentsForVisaType 
} from '@/services/applicationService';
import { VisaApplication, Document, RequiredDocument } from '@/types/application';
import { useToast } from '@/hooks/use-toast';

const customerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional()
});

const UploadDocuments = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [application, setApplication] = useState<VisaApplication | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<'details' | 'documents'>('details');
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!token) return;

    const loadData = () => {
      const app = getVisaApplicationByToken(token);
      if (app) {
        setApplication(app);
        setDocuments(getDocumentsForApplication(app.id));
        setRequiredDocuments(getRequiredDocumentsForVisaType(app.type));
        
        if (app.status !== 'pending') {
          setStage('documents');
        }
      }
      setLoading(false);
    };

    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="container mx-auto text-center py-12">
        <p>Loading visa application...</p>
      </div>
    );
  }

  if (!application || !token) {
    return (
      <div className="container mx-auto max-w-2xl text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Invalid Link</h2>
          <p className="mb-4">This document collection link is invalid or has expired.</p>
          <p className="text-sm text-muted-foreground">
            Please contact your travel agent for a new link.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto max-w-2xl text-center py-12">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
            Documents Submitted Successfully
          </h2>
          <p className="mb-6">
            Thank you for submitting your documents for your UAE visa application. 
            Your travel agent will review your documents and contact you if any additional information is needed.
          </p>
          <div className="text-sm text-muted-foreground">
            You may close this window now.
          </div>
        </div>
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

  const onCustomerInfoSubmit = async (data: z.infer<typeof customerSchema>) => {
    try {
      const updated = updateCustomerInfo(token, data.email, data.phone || undefined);
      
      if (updated) {
        toast({
          title: "Information saved",
          description: "Your contact information has been saved"
        });
        
        setStage('documents');
      } else {
        toast({
          title: "Error",
          description: "Failed to save your information. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating customer info:', error);
      toast({
        title: "Error",
        description: "There was an error saving your information. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (documentId: string, file: File) => {
    setUploading(documentId);
    
    // Simulate file upload with a delay
    try {
      // In a real application, here you would upload the file to a storage service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a mock URL for the file (in a real app, this would be the storage URL)
      const mockUrl = URL.createObjectURL(file);
      
      // Update document status
      updateDocumentStatus(documentId, 'received', mockUrl);
      
      // Update documents list
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'received' as const, url: mockUrl, uploadDate: new Date() } 
            : doc
        )
      );
      
      toast({
        title: "Upload complete",
        description: `${file.name} has been uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  };

  const checkCompletion = () => {
    const allUploaded = documents.every(doc => 
      doc.status === 'received' || 
      !requiredDocuments.find(rd => rd.type === doc.type)?.required
    );
    
    if (allUploaded) {
      setSubmitted(true);
      toast({
        title: "All documents submitted",
        description: "Thank you for submitting all required documents"
      });
    } else {
      toast({
        title: "Documents missing",
        description: "Please upload all required documents before submitting",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flight-pattern">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <PlaneTakeoff className="h-8 w-8 text-travel-blue" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">UAE Visa Document Collection</h1>
          <p className="text-muted-foreground mt-2">
            For {application.customerName}'s visa application
          </p>
        </div>
        
        {stage === 'details' ? (
          <Card className="travel-card mb-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Mail className="h-5 w-5 text-travel-blue" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Please provide your contact information for communication about your visa application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCustomerInfoSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          We'll send visa updates to this email
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 123 456 7890" {...field} />
                        </FormControl>
                        <FormDescription>
                          For urgent communications regarding your visa
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    Continue to Document Upload
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="travel-card mb-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-travel-blue" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Traveler Name</Label>
                    <div className="font-medium">{application.customerName}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Visa Type</Label>
                    <div className="font-medium">UAE Tourist Visa</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Travel Dates</Label>
                    <div className="font-medium">
                      {formatDate(application.startDate)} - {formatDate(application.endDate)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Duration</Label>
                    <div className="font-medium">
                      {Math.ceil(
                        (new Date(application.endDate).getTime() - 
                          new Date(application.startDate).getTime()) / 
                        (1000 * 60 * 60 * 24)
                      )} days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="travel-card mb-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5 text-travel-blue" />
                  Required Documents
                </CardTitle>
                <CardDescription>
                  Please upload the following documents for your visa application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {documents.map((doc) => {
                    const requiredDoc = requiredDocuments.find(rd => rd.type === doc.type);
                    
                    return (
                      <div key={doc.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {requiredDoc?.description || "Please upload this document"}
                            </div>
                          </div>
                          {doc.status === 'received' && (
                            <div className="flex items-center text-green-500 text-sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Uploaded
                            </div>
                          )}
                        </div>
                        
                        {doc.status === 'pending' ? (
                          <div>
                            <Label htmlFor={`upload-${doc.id}`} className="cursor-pointer">
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                                <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground/70" />
                                <p className="text-sm font-medium mb-1">Click to upload</p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG, or PDF (max 10MB)
                                </p>
                              </div>
                            </Label>
                            <Input
                              id={`upload-${doc.id}`}
                              type="file"
                              className="hidden"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(doc.id, file);
                                }
                              }}
                              disabled={uploading === doc.id}
                            />
                            {uploading === doc.id && (
                              <div className="text-center text-sm text-muted-foreground mt-2">
                                Uploading... Please wait
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-travel-blue" />
                                <span className="text-sm">Document uploaded</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // In a real app, this would view the document
                                  if (doc.url) {
                                    window.open(doc.url, '_blank');
                                  }
                                }}
                              >
                                View
                              </Button>
                            </div>
                            {doc.uploadDate && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Uploaded on {formatDate(doc.uploadDate)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-8">
                  <Button 
                    onClick={checkCompletion} 
                    className="w-full"
                    variant="default"
                  >
                    Submit Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadDocuments;
