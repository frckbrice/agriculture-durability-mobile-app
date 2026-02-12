
import { TransmissionForm } from '@/interfaces/types';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

export const generatePDF = async (form: TransmissionForm): Promise<string> => {
  const html = `
    <html>
      <body>
        <h1>Transmission and Declaration Form</h1>
        <p><strong>Market Number:</strong> ${form?.marketNumber}</p>
        <p><strong>Sender Name:</strong> ${form?.senderName}</p>
        <p><strong>Recipient Name:</strong> ${form?.recipientName}</p>
        <p><strong>Ministry Agent Name:</strong> ${form?.ministryAgentName}</p>
        <p><strong>Vehicle Registration:</strong> ${form?.vehicleRegistration}</p>
        <p><strong>Driver Name:</strong> ${form?.driverName}</p>
        <p><strong>Number of Bags:</strong> ${form?.numberOfBags}</p>
        <p><strong>Product Quality:</strong> ${form?.productQuality}</p>
        <h2>Signatures</h2>
        <img src="${form.senderSignature}" alt="Sender Signature" />
        <img src="${form.carrierSignature}" alt="Carrier Signature" />
        <img src="${form.ministrySignature}" alt="Ministry Signature" />
      </body>
    </html>
  `;

  const options = {
    html,
    fileName: 'transmission_form',
    directory: 'Documents',
  };

  try {
    const file = await RNHTMLtoPDF.convert(options);
    return file.base64 as string;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};
