
import { 
  VisaApplication, 
  Customer, 
  Document, 
  RequiredDocument, 
  UAE_REQUIRED_DOCUMENTS,
  DocumentStorage
} from '@/types/application';
import { v4 as uuidv4 } from 'uuid';
import { ExtractedDocumentData } from '@/services/ocrService';

// Simulate stored data with localStorage
const getStoredApplications = (): VisaApplication[] => {
  const stored = localStorage.getItem('visa_applications');
  return stored ? JSON.parse(stored) : [];
};

const getStoredCustomers = (): Customer[] => {
  const stored = localStorage.getItem('customers');
  return stored ? JSON.parse(stored) : [];
};

const getStoredDocuments = (): Document[] => {
  const stored = localStorage.getItem('documents');
  return stored ? JSON.parse(stored) : [];
};

const getStoredDocumentStorage = (): DocumentStorage[] => {
  const stored = localStorage.getItem('document_storage');
  return stored ? JSON.parse(stored) : [];
};

const saveApplications = (applications: VisaApplication[]) => {
  localStorage.setItem('visa_applications', JSON.stringify(applications));
};

const saveCustomers = (customers: Customer[]) => {
  localStorage.setItem('customers', JSON.stringify(customers));
};

const saveDocuments = (documents: Document[]) => {
  localStorage.setItem('documents', JSON.stringify(documents));
};

const saveDocumentStorage = (documentStorage: DocumentStorage[]) => {
  localStorage.setItem('document_storage', JSON.stringify(documentStorage));
};

export const createVisaApplication = (
  customerName: string,
  startDate: Date,
  endDate: Date
): VisaApplication => {
  // Create or find customer
  const customers = getStoredCustomers();
  const existingCustomer = customers.find(c => c.name === customerName);
  
  let customerId;
  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    customerId = uuidv4();
    const newCustomer: Customer = {
      id: customerId,
      name: customerName,
      email: '', // Will be collected when customer opens the link
      created: new Date()
    };
    customers.push(newCustomer);
    saveCustomers(customers);
  }

  // Create application
  const applicationId = uuidv4();
  const shareableToken = uuidv4().split('-')[0]; // Shortened UUID for URL
  
  const application: VisaApplication = {
    id: applicationId,
    customerId,
    customerName,
    type: 'UAE',
    startDate,
    endDate,
    status: 'pending',
    created: new Date(),
    updated: new Date(),
    shareableLink: `/upload/${shareableToken}`
  };

  // Save application
  const applications = getStoredApplications();
  applications.push(application);
  saveApplications(applications);

  // Create required document entries
  const documents: Document[] = UAE_REQUIRED_DOCUMENTS.map(doc => ({
    id: uuidv4(),
    applicationId,
    type: doc.type,
    name: doc.name,
    status: 'pending'
  }));

  // Save documents
  const allDocuments = getStoredDocuments();
  allDocuments.push(...documents);
  saveDocuments(allDocuments);

  return application;
};

export const getVisaApplications = (): VisaApplication[] => {
  return getStoredApplications();
};

export const getVisaApplicationById = (id: string): VisaApplication | undefined => {
  const applications = getStoredApplications();
  return applications.find(app => app.id === id);
};

export const getVisaApplicationByToken = (token: string): VisaApplication | undefined => {
  const applications = getStoredApplications();
  return applications.find(app => app.shareableLink?.includes(token));
};

export const getDocumentsForApplication = (applicationId: string): Document[] => {
  const documents = getStoredDocuments();
  return documents.filter(doc => doc.applicationId === applicationId);
};

export const getRequiredDocumentsForVisaType = (type: 'UAE'): RequiredDocument[] => {
  return UAE_REQUIRED_DOCUMENTS;
};

export const storeDocumentData = (
  documentId: string,
  file: File,
  dataUrl: string
): DocumentStorage => {
  const documents = getStoredDocuments();
  const document = documents.find(doc => doc.id === documentId);
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  // Check if there's an existing storage entry and remove it (for replacement)
  const documentStorage = getStoredDocumentStorage();
  const existingIndex = documentStorage.findIndex(storage => storage.documentId === documentId);
  
  if (existingIndex !== -1) {
    // Remove existing document storage
    documentStorage.splice(existingIndex, 1);
  }
  
  const storage: DocumentStorage = {
    id: uuidv4(),
    documentId,
    applicationId: document.applicationId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    dataUrl,
    uploadDate: new Date()
  };
  
  documentStorage.push(storage);
  saveDocumentStorage(documentStorage);
  
  return storage;
};

export const getDocumentStorageById = (storageId: string): DocumentStorage | undefined => {
  const documentStorage = getStoredDocumentStorage();
  return documentStorage.find(storage => storage.id === storageId);
};

export const getDocumentStorageByDocumentId = (documentId: string): DocumentStorage | undefined => {
  const documentStorage = getStoredDocumentStorage();
  return documentStorage.find(storage => storage.documentId === documentId);
};

export const getDocumentStorageForApplication = (applicationId: string): DocumentStorage[] => {
  const documentStorage = getStoredDocumentStorage();
  return documentStorage.filter(storage => storage.applicationId === applicationId);
};

export const getAllDocumentStorage = (): DocumentStorage[] => {
  return getStoredDocumentStorage();
};

export const updateDocumentStatus = (
  documentId: string, 
  status: Document['status'], 
  url?: string,
  extractedData?: ExtractedDocumentData,
  file?: File,
  dataUrl?: string
): Document => {
  const documents = getStoredDocuments();
  const documentIndex = documents.findIndex(doc => doc.id === documentId);
  
  if (documentIndex === -1) {
    throw new Error('Document not found');
  }
  
  // Update the document status
  documents[documentIndex] = {
    ...documents[documentIndex],
    status,
    url,
    uploadDate: status === 'received' ? new Date() : undefined,
    extractedData: status === 'received' ? (extractedData || documents[documentIndex].extractedData) : undefined
  };
  
  saveDocuments(documents);
  
  // If we have a file and dataUrl, store it in the document storage
  if (file && dataUrl && status === 'received') {
    storeDocumentData(documentId, file, dataUrl);
  }
  
  // If document status is pending (being replaced), remove it from storage
  if (status === 'pending') {
    const documentStorage = getStoredDocumentStorage();
    const updatedStorage = documentStorage.filter(storage => storage.documentId !== documentId);
    saveDocumentStorage(updatedStorage);
  }
  
  // If we have extracted data from a passport or PAN card, update the application
  if (extractedData && status === 'received' &&
      (documents[documentIndex].type === 'passport' || 
       documents[documentIndex].type === 'pan_card')) {
    updateApplicationWithExtractedData(
      documents[documentIndex].applicationId,
      extractedData
    );
  }
  
  // Check if all documents are received and update application status
  const applicationId = documents[documentIndex].applicationId;
  const applicationDocuments = documents.filter(doc => doc.applicationId === applicationId);
  const allDocumentsReceived = applicationDocuments.every(doc => doc.status === 'received');
  
  if (allDocumentsReceived) {
    const applications = getStoredApplications();
    const applicationIndex = applications.findIndex(app => app.id === applicationId);
    
    if (applicationIndex !== -1) {
      applications[applicationIndex] = {
        ...applications[applicationIndex],
        status: 'documents_received',
        updated: new Date()
      };
      
      saveApplications(applications);
    }
  }
  
  return documents[documentIndex];
};

export const updateApplicationWithExtractedData = (
  applicationId: string,
  extractedData: ExtractedDocumentData
): boolean => {
  const applications = getStoredApplications();
  const applicationIndex = applications.findIndex(app => app.id === applicationId);
  
  if (applicationIndex === -1) {
    return false;
  }
  
  // Create or update the extractedData field
  const currentExtractedData = applications[applicationIndex].extractedData || {};
  
  // Update with new data
  const updatedExtractedData = {
    ...currentExtractedData
  };
  
  if (extractedData.documentType === 'passport') {
    if (extractedData.documentNumber) updatedExtractedData.passportNumber = extractedData.documentNumber;
    if (extractedData.fullName) updatedExtractedData.fullName = extractedData.fullName;
    if (extractedData.dateOfBirth) updatedExtractedData.dateOfBirth = extractedData.dateOfBirth;
    if (extractedData.nationality) updatedExtractedData.nationality = extractedData.nationality;
  } else if (extractedData.documentType === 'pan') {
    if (extractedData.panNumber) updatedExtractedData.panNumber = extractedData.panNumber;
    // If no name from passport yet, use the name from PAN
    if (extractedData.fullName && !updatedExtractedData.fullName) {
      updatedExtractedData.fullName = extractedData.fullName;
    }
  }
  
  // Update the application
  applications[applicationIndex] = {
    ...applications[applicationIndex],
    extractedData: updatedExtractedData,
    updated: new Date()
  };
  
  saveApplications(applications);
  return true;
};

export const updateCustomerInfo = (
  applicationToken: string,
  email: string,
  phone?: string
): boolean => {
  const applications = getStoredApplications();
  const applicationIndex = applications.findIndex(app => app.shareableLink?.includes(applicationToken));
  
  if (applicationIndex === -1) {
    return false;
  }
  
  const customerId = applications[applicationIndex].customerId;
  const customers = getStoredCustomers();
  const customerIndex = customers.findIndex(c => c.id === customerId);
  
  if (customerIndex === -1) {
    return false;
  }
  
  customers[customerIndex] = {
    ...customers[customerIndex],
    email,
    phone
  };
  
  saveCustomers(customers);
  
  // Update application status
  applications[applicationIndex] = {
    ...applications[applicationIndex],
    status: 'documents_requested',
    updated: new Date()
  };
  
  saveApplications(applications);
  
  return true;
};
