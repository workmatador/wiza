
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
  Phone,
  Scan,
  Camera,
  AlertCircle
} from 'lucide-react';
import { 
  getVisaApplicationByToken, 
  getDocumentsForApplication, 
  updateDocumentStatus, 
  updateCustomerInfo, 
  getRequiredDocumentsForVisaType 
} from '@/services/applicationService';
import { extractPassportData, extractPanCardData } from '@/services/ocrService';
import { VisaApplication, Document, RequiredDocument } from '@/types/application';
import { useToast } from '@/hooks/use-toast';
import SelfieCapture from '@/components/SelfieCapture';
import OcrDataDisplay from '@/components/OcrDataDisplay';
import VisaPredictionMeter from '@/components/VisaPredictionMeter';

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
  const [processing, setProcessing] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [currentSelfieDocId, setCurrentSelfieDocId] = useState<string | null>(null);

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
      const updated = updateCustomerInfo(token!, data.email, data.phone || undefined);
      
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
    
    try {
      const documentType = documents.find(d => d.id === documentId)?.type;
      let extractedData;
      
      if (documentType === 'passport' || documentType === 'pan_card') {
        setProcessing(documentId);
        toast({
          title: "Processing document",
          description: "Please wait while we extract information from your document"
        });
        
        if (documentType === 'passport') {
          extractedData = await extractPassportData(file);
          toast({
            title: "Passport processed",
            description: extractedData.fullName 
              ? `Successfully extracted data for ${extractedData.fullName}` 
              : "Document processed, but could not extract all information"
          });
        } else if (documentType === 'pan_card') {
          extractedData = await extractPanCardData(file);
          toast({
            title: "PAN card processed",
            description: extractedData.panNumber 
              ? `Successfully extracted PAN number ${extractedData.panNumber}` 
              : "Document processed, but could not extract all information"
          });
        }
        
        setProcessing(null);
      }
      
      const mockUrl = URL.createObjectURL(file);
      
      updateDocumentStatus(documentId, 'received', mockUrl, extractedData);
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { 
                ...doc, 
                status: 'received' as const, 
                url: mockUrl, 
                uploadDate: new Date(),
                extractedData: extractedData || undefined
              } 
            : doc
        )
      );
      
      if (application) {
        const updatedApp = getVisaApplicationByToken(token!);
        if (updatedApp) {
          setApplication(updatedApp);
        }
      }
      
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

  const handleSelfieCapture = (documentId: string) => {
    setCurrentSelfieDocId(documentId);
    setShowSelfieCapture(true);
  };

  const onSelfieCapture = async (blob: Blob) => {
    if (!currentSelfieDocId) return;
    
    setUploading(currentSelfieDocId);
    
    try {
      const mockUrl = URL.createObjectURL(blob);
      
      updateDocumentStatus(currentSelfieDocId, 'received', mockUrl);
      
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === currentSelfieDocId 
            ? { ...doc, status: 'received' as const, url: mockUrl, uploadDate: new Date() } 
            : doc
        )
      );
      
      toast({
        title: "Selfie captured",
        description: "Your passport photo has been captured successfully"
      });
      
      setShowSelfieCapture(false);
      setCurrentSelfieDocId(null);
    } catch (error) {
      console.error('Error saving selfie:', error);
      toast({
        title: "Error",
        description: "Failed to save your selfie. Please try again.",
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
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <PlaneTakeoff className="h-8 w-8 text-travel-blue" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">UAE Visa Document Collection</h1>
          {application && (
            <p className="text-muted-foreground mt-2">
              For {application.customerName}'s visa application
            </p>
          )}
        </div>
        
        {loading ? (
          <div className="container mx-auto text-center py-12">
            <p>Loading visa application...</p>
          </div>
        ) : !application || !token ? (
          <div className="container mx-auto max-w-2xl text-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Invalid Link</h2>
              <p className="mb-4">This document collection link is invalid or has expired.</p>
              <p className="text-sm text-muted-foreground">
                Please contact your travel agent for a new link.
              </p>
            </div>
          </div>
        ) : submitted ? (
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
        ) : (
          <>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card className="travel-card">
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
                      
                      {application.extractedData && Object.keys(application.extractedData).length > 0 && (
                        <div className="mt-6 border-t pt-4">
                          <h3 className="font-medium mb-2">Extracted Information</h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            {application.extractedData.fullName && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Full Name</Label>
                                <div>{application.extractedData.fullName}</div>
                              </div>
                            )}
                            
                            {application.extractedData.passportNumber && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Passport Number</Label>
                                <div>{application.extractedData.passportNumber}</div>
                              </div>
                            )}
                            
                            {application.extractedData.dateOfBirth && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Date of Birth</Label>
                                <div>{application.extractedData.dateOfBirth}</div>
                              </div>
                            )}
                            
                            {application.extractedData.nationality && (
                              <div>
                                <Label className="text-sm text-muted-foreground">Nationality</Label>
                                <div>{application.extractedData.nationality}</div>
                              </div>
                            )}
                            
                            {application.extractedData.panNumber && (
                              <div>
                                <Label className="text-sm text-muted-foreground">PAN Number</Label>
                                <div>{application.extractedData.panNumber}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {application && application.extractedData && <OcrDataDisplay application={application} showSource={false} />}
                  
                  <Card className="travel-card">
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
                          const extractedPassportNumber = doc.extractedData?.passportNumber || doc.extractedData?.documentNumber;
                          
                          return (
                            <div key={doc.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-medium flex items-center">
                                    {doc.name}
                                    {(doc.type === 'passport' || doc.type === 'pan_card') && (
                                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                        OCR Enabled
                                      </span>
                                    )}
                                  </div>
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
                                  {doc.type === 'selfie' ? (
                                    <Button
                                      onClick={() => handleSelfieCapture(doc.id)}
                                      className="w-full"
                                      variant="outline"
                                      disabled={uploading === doc.id}
                                    >
                                      <Camera className="mr-2 h-4 w-4" />
                                      Take Passport Photo
                                    </Button>
                                  ) : (
                                    <>
                                      <Label htmlFor={`upload-${doc.id}`} className="cursor-pointer">
                                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                                          {processing === doc.id ? (
                                            <div className="flex flex-col items-center">
                                              <Scan className="h-8 w-8 mx-auto mb-2 text-muted-foreground/70 animate-pulse" />
                                              <p className="text-sm font-medium mb-1">Processing document...</p>
                                              <p className="text-xs text-muted-foreground">
                                                Using OCR to extract information
                                              </p>
                                            </div>
                                          ) : (
                                            <>
                                              <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground/70" />
                                              <p className="text-sm font-medium mb-1">Click to upload</p>
                                              <p className="text-xs text-muted-foreground">
                                                PNG, JPG, or PDF (max 10MB)
                                              </p>
                                            </>
                                          )}
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
                                        disabled={uploading === doc.id || processing === doc.id}
                                      />
                                    </>
                                  )}
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
                                  
                                  {doc.type === 'passport' && doc.extractedData && extractedPassportNumber && (
                                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                                      <div className="flex items-center text-sm">
                                        <Scan className="h-4 w-4 mr-2 text-travel-blue" />
                                        <span className="font-medium">Passport No.:</span>
                                        <span className="ml-2">{extractedPassportNumber}</span>
                                      </div>
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
                </div>
                
                <div className="space-y-6">
                  <VisaPredictionMeter 
                    documents={documents} 
                    requiredDocuments={requiredDocuments} 
                  />
                  
                  <Card className="travel-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Submission Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {requiredDocuments.filter(doc => doc.required).map((doc) => {
                          const isUploaded = documents.some(
                            d => d.type === doc.type && d.status === 'received'
                          );
                          
                          return (
                            <li key={doc.type} className="flex items-center">
                              {isUploaded ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
                              )}
                              <span className={isUploaded ? "text-muted-foreground line-through" : ""}>
                                {doc.name}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {showSelfieCapture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Take Passport Photo</h3>
              <p className="text-sm text-muted-foreground">
                Position your face within the circle and take a photo
              </p>
            </div>
            <div className="p-4">
              <SelfieCapture onCapture={onSelfieCapture} />
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSelfieCapture(false);
                  setCurrentSelfieDocId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDocuments;
