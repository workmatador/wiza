
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Document, RequiredDocument, VisaApplication } from '@/types/application';
import { TrendingUp, ShieldCheck, AlertCircle, Info, CalendarRange } from 'lucide-react';

interface VisaPredictionMeterProps {
  documents: Document[];
  requiredDocuments: RequiredDocument[];
  application?: VisaApplication;
}

const VisaPredictionMeter: React.FC<VisaPredictionMeterProps> = ({
  documents,
  requiredDocuments,
  application,
}) => {
  // Calculate the percentage of required documents that have been uploaded
  const calculateApprovalChance = (): number => {
    if (!application) return 0;
    
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    
    if (requiredDocs.length === 0) return 0;
    
    // Check if each required document type has been successfully uploaded
    let completedCount = 0;
    let totalPoints = requiredDocs.length;
    let earnedPoints = 0;
    
    // Check documents
    requiredDocs.forEach(requiredDoc => {
      const doc = documents.find(
        d => d.type === requiredDoc.type && d.status === 'received'
      );
      
      if (doc) {
        completedCount++;
        earnedPoints++;
      }
    });
    
    // Check if flight ticket dates match visa dates
    const flightTicket = documents.find(doc => 
      doc.type === 'flight_ticket' && doc.status === 'received'
    );
    
    // Add extra check for flight dates
    if (flightTicket && application) {
      // Add an extra point for date validation
      totalPoints += 1;
      
      // If we have extracted data with flight dates
      if (flightTicket.extractedData?.departureDate && flightTicket.extractedData?.returnDate) {
        const departure = new Date(flightTicket.extractedData.departureDate);
        const returnDate = new Date(flightTicket.extractedData.returnDate);
        const visaStart = new Date(application.startDate);
        const visaEnd = new Date(application.endDate);
        
        // Check if the flight dates are within the visa dates (with 1 day buffer)
        const isWithinDates = 
          (Math.abs(departure.getTime() - visaStart.getTime()) <= 86400000) && // 1 day in milliseconds
          (Math.abs(returnDate.getTime() - visaEnd.getTime()) <= 86400000);
        
        if (isWithinDates) {
          earnedPoints += 1;
        }
      }
    }
    
    return Math.round((earnedPoints / totalPoints) * 100);
  };
  
  const approvalChance = calculateApprovalChance();
  
  // Check specifically if flight dates match visa dates
  const checkFlightDates = (): { match: boolean; message: string } => {
    if (!application) return { match: false, message: "No application data" };
    
    const flightTicket = documents.find(doc => 
      doc.type === 'flight_ticket' && doc.status === 'received'
    );
    
    if (!flightTicket) {
      return { match: false, message: "Flight ticket not uploaded" };
    }
    
    if (!flightTicket.extractedData?.departureDate || !flightTicket.extractedData?.returnDate) {
      return { match: false, message: "Flight dates not detected" };
    }
    
    const departure = new Date(flightTicket.extractedData.departureDate);
    const returnDate = new Date(flightTicket.extractedData.returnDate);
    const visaStart = new Date(application.startDate);
    const visaEnd = new Date(application.endDate);
    
    // Check if the flight dates match the visa dates (with 1 day buffer)
    const departureDiff = Math.abs(departure.getTime() - visaStart.getTime());
    const returnDiff = Math.abs(returnDate.getTime() - visaEnd.getTime());
    
    if (departureDiff <= 86400000 && returnDiff <= 86400000) {
      return { match: true, message: "Flight dates match visa dates" };
    } else {
      return { 
        match: false, 
        message: "Flight dates don't match visa dates (should be " + 
                  formatDate(visaStart) + " to " + formatDate(visaEnd) + ")" 
      };
    }
  };
  
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
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
  const flightDatesCheck = checkFlightDates();
  
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
          
          {/* Flight dates check */}
          {documents.some(doc => doc.type === 'flight_ticket' && doc.status === 'received') && (
            <div className={`mt-2 p-2 rounded-md flex items-start gap-2 ${
              flightDatesCheck.match 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' 
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800'
            }`}>
              <CalendarRange className={`h-4 w-4 mt-0.5 ${
                flightDatesCheck.match ? 'text-green-500' : 'text-amber-500'
              }`} />
              <div className="text-sm flex-1">
                <span className="font-medium">Flight Dates: </span>
                <span>{flightDatesCheck.message}</span>
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
            <p>This prediction is based on document completion and is provided for guidance only.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisaPredictionMeter;
