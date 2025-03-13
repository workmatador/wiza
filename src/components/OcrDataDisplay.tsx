
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSearch, Scan } from 'lucide-react';
import { VisaApplication } from '@/types/application';

interface OcrDataDisplayProps {
  application: VisaApplication;
}

const OcrDataDisplay: React.FC<OcrDataDisplayProps> = ({ application }) => {
  // Check if there's any extracted data to display
  const hasExtractedData = application.extractedData && 
    Object.keys(application.extractedData).some(key => 
      application.extractedData?.[key as keyof typeof application.extractedData]);

  if (!hasExtractedData) {
    return null;
  }

  const { extractedData } = application;

  // Define fields to display
  const fields = [
    { key: 'passportNumber', label: 'Passport Number' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'panNumber', label: 'PAN Number' }
  ];

  // Filter fields that have values
  const availableFields = fields.filter(
    field => extractedData?.[field.key as keyof typeof extractedData]
  );

  return (
    <Card className="travel-card mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <FileSearch className="h-5 w-5 text-travel-blue" />
          <CardTitle>OCR Extracted Data</CardTitle>
        </div>
        <CardDescription>
          Information automatically extracted from uploaded documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-1/4">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availableFields.map((field) => (
              <TableRow key={field.key}>
                <TableCell className="font-medium">{field.label}</TableCell>
                <TableCell>
                  {extractedData?.[field.key as keyof typeof extractedData]}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Scan className="h-3 w-3 mr-1" />
                    {field.key === 'panNumber' ? 'PAN Card' : 'Passport'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OcrDataDisplay;
