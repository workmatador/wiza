
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Document, RequiredDocument } from '@/types/application';
import { TrendingUp, ShieldCheck, AlertCircle, Info } from 'lucide-react';

interface VisaPredictionMeterProps {
  documents: Document[];
  requiredDocuments: RequiredDocument[];
}

const VisaPredictionMeter: React.FC<VisaPredictionMeterProps> = ({
  documents,
  requiredDocuments,
}) => {
  // Calculate the percentage of required documents that have been uploaded
  const calculateApprovalChance = (): number => {
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    
    if (requiredDocs.length === 0) return 0;
    
    // Check if each required document type has been successfully uploaded
    let completedCount = 0;
    
    requiredDocs.forEach(requiredDoc => {
      const docUploaded = documents.some(
        doc => doc.type === requiredDoc.type && doc.status === 'received'
      );
      
      if (docUploaded) {
        completedCount++;
      }
    });
    
    return Math.round((completedCount / requiredDocs.length) * 100);
  };
  
  const approvalChance = calculateApprovalChance();
  
  // Determine the status based on the approval chance
  const getStatusInfo = () => {
    if (approvalChance < 40) {
      return {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        text: 'Low',
        color: 'text-red-500',
        message: 'Several required documents are missing.',
      };
    } else if (approvalChance < 80) {
      return {
        icon: <Info className="h-5 w-5 text-amber-500" />,
        text: 'Moderate',
        color: 'text-amber-500',
        message: 'More documents needed for higher chances.',
      };
    } else {
      return {
        icon: <ShieldCheck className="h-5 w-5 text-green-500" />,
        text: 'High',
        color: 'text-green-500',
        message: 'Your documentation is nearly complete.',
      };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <Card className="travel-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-travel-blue" />
          Visa Approval Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {statusInfo.icon}
              <span className={`ml-2 font-medium ${statusInfo.color}`}>
                {statusInfo.text} Chances
              </span>
            </div>
            <span className="font-bold text-lg">{approvalChance}%</span>
          </div>
          
          <Progress value={approvalChance} className="h-2" />
          
          <p className="text-sm text-muted-foreground">{statusInfo.message}</p>
          
          <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
            <p>This prediction is based on document completion and is provided for guidance only.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisaPredictionMeter;
