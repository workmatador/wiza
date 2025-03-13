
import { createWorker } from 'tesseract.js';

export interface ExtractedDocumentData {
  documentType: 'passport' | 'pan' | 'other';
  fullName?: string;
  dateOfBirth?: string;
  dateOfIssue?: string;
  dateOfExpiry?: string;
  documentNumber?: string;
  nationality?: string;
  panNumber?: string;
  passportNumber?: string;
}

export const extractTextFromImage = async (imageFile: File): Promise<string> => {
  try {
    const worker = await createWorker('eng');
    
    // Convert file to image data URL
    const imageDataUrl = await fileToDataURL(imageFile);
    
    // Recognize text
    const { data } = await worker.recognize(imageDataUrl);
    await worker.terminate();
    
    console.log("Extracted raw text:", data.text);
    return data.text;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
};

export const extractPassportData = async (imageFile: File): Promise<ExtractedDocumentData> => {
  try {
    const text = await extractTextFromImage(imageFile);
    
    // Parse passport data from text
    const extractedData: ExtractedDocumentData = {
      documentType: 'passport',
    };
    
    // Extract common passport fields
    const lines = text.split('\n');
    
    // Indian passport specific patterns
    const indianPassportNumberPattern = /[A-Z][0-9]{7}/; // Format L1234567 (letter followed by 7 digits)
    
    // Try to find passport number across all lines
    for (const line of lines) {
      // Indian passport number - typically on right side of Indian passports
      const passportMatch = line.match(indianPassportNumberPattern);
      if (passportMatch) {
        extractedData.passportNumber = passportMatch[0];
        extractedData.documentNumber = passportMatch[0]; // Set both fields for backward compatibility
        console.log("Found passport number:", passportMatch[0]);
      }
      
      // Name - usually appears after "Name" or "Surname"/"Given names" 
      if (line.match(/surname|given\s*names|name/i) && !extractedData.fullName) {
        const nameParts = line.split(/[:<]/);
        if (nameParts.length > 1) {
          extractedData.fullName = nameParts[nameParts.length - 1].trim();
        }
      }
      
      // Dates - look for date patterns
      const datePattern = /\d{1,2}\s*[.-/]\s*\d{1,2}\s*[.-/]\s*\d{2,4}/g;
      const dateMatches = line.match(datePattern);
      
      if (dateMatches) {
        if (line.match(/birth|dob/i)) {
          extractedData.dateOfBirth = dateMatches[0];
        } else if (line.match(/expiry|expiration|exp/i)) {
          extractedData.dateOfExpiry = dateMatches[0];
        } else if (line.match(/issue|issued/i)) {
          extractedData.dateOfIssue = dateMatches[0];
        }
      }
      
      // Nationality
      if (line.match(/nationality|nation/i)) {
        const nationalityParts = line.split(/[:<]/);
        if (nationalityParts.length > 1) {
          extractedData.nationality = nationalityParts[nationalityParts.length - 1].trim();
        }
      }
    }
    
    // If no passport number found yet, try to find it with less restrictive pattern
    if (!extractedData.passportNumber) {
      // Try fallback pattern - any letter followed by 7-8 digits
      const fallbackPatterns = [
        /[A-Z][0-9]{7,8}/g,
        /Passport No\.?\s*([A-Z][0-9]{7,8})/i,
        /No\.?\s*([A-Z][0-9]{7,8})/i,
        /Document No\.?\s*([A-Z][0-9]{7,8})/i
      ];
      
      for (const pattern of fallbackPatterns) {
        for (const line of lines) {
          const matches = line.match(pattern);
          if (matches) {
            // Use the first match
            extractedData.passportNumber = matches[0].replace(/Passport No\.?\s*|No\.?\s*|Document No\.?\s*/i, '');
            extractedData.documentNumber = extractedData.passportNumber;
            console.log("Found passport number with fallback pattern:", extractedData.passportNumber);
            break;
          }
        }
        if (extractedData.passportNumber) break;
      }
    }
    
    console.log("Extracted passport data:", extractedData);
    return extractedData;
  } catch (error) {
    console.error('Passport OCR Error:', error);
    return { documentType: 'passport' };
  }
};

export const extractPanCardData = async (imageFile: File): Promise<ExtractedDocumentData> => {
  try {
    const text = await extractTextFromImage(imageFile);
    
    // Parse PAN card data
    const extractedData: ExtractedDocumentData = {
      documentType: 'pan',
    };
    
    // Extract PAN number (Format: AAAAA0000A)
    const panPattern = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    const panMatch = text.match(panPattern);
    
    if (panMatch) {
      extractedData.panNumber = panMatch[0];
    }
    
    // Extract name
    const namePattern = /name\s*[:\s]\s*([A-Za-z\s]+)/i;
    const nameMatch = text.match(namePattern);
    
    if (nameMatch && nameMatch[1]) {
      extractedData.fullName = nameMatch[1].trim();
    }
    
    // Extract date of birth
    const dobPattern = /DOB\s*[:\s]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;
    const dobMatch = text.match(dobPattern);
    
    if (dobMatch && dobMatch[1]) {
      extractedData.dateOfBirth = dobMatch[1];
    }
    
    return extractedData;
  } catch (error) {
    console.error('PAN Card OCR Error:', error);
    return { documentType: 'pan' };
  }
};

// Helper function to convert File to data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
