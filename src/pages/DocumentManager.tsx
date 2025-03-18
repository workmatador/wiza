
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  FileType2, 
  User, 
  RefreshCw,
  Database
} from 'lucide-react';
import { 
  getAllDocumentStorage, 
  getVisaApplicationById 
} from '@/services/applicationService';
import { DocumentStorage, VisaApplication } from '@/types/application';
import { useToast } from '@/hooks/use-toast';

const DocumentManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<(DocumentStorage & { application?: VisaApplication })[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<(DocumentStorage & { application?: VisaApplication })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = documents.filter(
        doc => 
          doc.fileName.toLowerCase().includes(query) ||
          doc.fileType.toLowerCase().includes(query) ||
          doc.application?.customerName.toLowerCase().includes(query)
      );
      setFilteredDocuments(filtered);
    }
  }, [searchQuery, documents]);

  const loadDocuments = () => {
    setLoading(true);
    try {
      const storedDocs = getAllDocumentStorage();
      
      // Enrich with application data
      const enrichedDocs = storedDocs.map(doc => {
        const application = getVisaApplicationById(doc.applicationId);
        return {
          ...doc,
          application
        };
      });
      
      setDocuments(enrichedDocs);
      setFilteredDocuments(enrichedDocs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "Failed to load document storage",
        variant: "destructive"
      });
      setLoading(false);
    }
  };
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const handleDownload = (doc: DocumentStorage) => {
    try {
      // Create an anchor element and set the download attributes
      const downloadLink = document.createElement('a');
      downloadLink.href = doc.dataUrl;
      downloadLink.download = doc.fileName;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Download Started",
        description: `Downloading ${doc.fileName}`
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleViewApplication = (applicationId: string) => {
    navigate(`/application/${applicationId}`);
  };

  return (
    <div className="container mx-auto max-w-6xl animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Storage</h1>
          <p className="text-muted-foreground mt-1">
            Manage and access all uploaded visa application documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
          <Button 
            variant="default" 
            onClick={loadDocuments}
            className="bg-[#fcb415] hover:bg-[#e8a614] text-black"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search documents by name, type, or customer"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-2">
            <Database className="h-8 w-8 animate-pulse text-[#fcb415]" />
            <p className="text-muted-foreground">Loading document storage...</p>
          </div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <FileText className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? 
                "No documents match your search criteria. Try a different search." : 
                "No documents have been uploaded yet."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-[#fcb415] shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Database className="h-5 w-5 mr-2 text-[#fcb415]" />
                Document Storage
              </CardTitle>
              <CardDescription>
                Showing {filteredDocuments.length} of {documents.length} documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">File Name</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Size</th>
                      <th className="text-left py-3 px-4">Customer</th>
                      <th className="text-left py-3 px-4">Upload Date</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-muted/30 group">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <FileType2 className="h-4 w-4 mr-2 text-[#fcb415]" />
                            <span className="font-medium truncate max-w-[200px]">{doc.fileName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs bg-yellow-100 text-yellow-800 py-1 px-2 rounded-full">
                            {doc.fileType.split('/')[1]?.toUpperCase() || doc.fileType}
                          </span>
                        </td>
                        <td className="py-3 px-4">{formatFileSize(doc.fileSize)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {doc.application?.customerName || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {formatDate(doc.uploadDate)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              className="h-8 gap-1"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Download</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewApplication(doc.applicationId)}
                              className="h-8 gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">View Application</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;
