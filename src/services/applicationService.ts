
import { 
  VisaApplication, 
  Customer, 
  Document, 
  RequiredDocument, 
  UAE_REQUIRED_DOCUMENTS 
} from '@/types/application';
import { v4 as uuidv4 } from 'uuid';

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

const saveApplications = (applications: VisaApplication[]) => {
  localStorage.setItem('visa_applications', JSON.stringify(applications));
};

const saveCustomers = (customers: Customer[]) => {
  localStorage.setItem('customers', JSON.stringify(customers));
};

const saveDocuments = (documents: Document[]) => {
  localStorage.setItem('documents', JSON.stringify(documents));
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

export const updateDocumentStatus = (documentId: string, status: Document['status'], url?: string): Document => {
  const documents = getStoredDocuments();
  const documentIndex = documents.findIndex(doc => doc.id === documentId);
  
  if (documentIndex === -1) {
    throw new Error('Document not found');
  }
  
  documents[documentIndex] = {
    ...documents[documentIndex],
    status,
    url,
    uploadDate: new Date()
  };
  
  saveDocuments(documents);
  
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
