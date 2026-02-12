import {
  AccompanyingSheet,
  Coordinate,
  FarmerData, Receipt,
  TransmissionForm,
  ValidationErrors,
  ValidationResult
} from "@/interfaces/types";
import { useFarmerDataStore } from "@/store/farmer-data-storage";
import axios from "axios";
import { Alert, Share, Linking, Platform } from "react-native";
// utils/pdfGenerator.ts
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { storeCurrentMarketData } from "@/store/mmkv-store";
import { Buffer } from 'buffer';
import AWS from 'aws-sdk';
import * as Location from 'expo-location';
import * as turf from '@turf/turf';
import { uploadResource } from "./api";



// import { PutObjectCommand } from "@aws-sdk/client-s3";
//import mime from 'mime';  //use libraries like mime to dynamically determine the file type


// get the market obejct from the sore at run time
const data =
  storeCurrentMarketData.getString('market-data')!
const marketProps = data && typeof data === 'string' && JSON.parse(data);

console.log("data", data);
// to generate p

export const checkConnectionAndUpload = async (isConnected: boolean, uploadData: () => void) => {
  // Get the network state once:
  // const netInfo = await NetInfo.fetch();
  if (isConnected) {
    Alert.alert(
      'Internet Connection Available',
      'Do you want to start uploading the data to the server?',
      [
        { text: 'Cancel', style: 'cancel', },

        { text: 'Yes', onPress: uploadData }
      ],
      { cancelable: true }
    );
  } else {
    Alert.alert('No Internet Connection', 'Please connect to the internet to upload data.');
  }
};


export const uploadData = async (
  farmerDataToQueu: FarmerData[],
  setFarmerDataToQueu: React.Dispatch<React.SetStateAction<FarmerData[]>>,
  token: string,
  API_URL: string
) => {
  const { saveFarmersData, clearFarmersData } = useFarmerDataStore()

  try {
    const length = farmerDataToQueu.length;
    let compteur = length;
    // for (const data of farmerDataToQueu) {
    for (let i = 0; i < length; i++) {
      await axios.post(`http://${API_URL}:5000/v1/inspection_data`, {
        headers: {
          Accept: "application/json",
          "content-type": "application/json",
          Authorisation: "Bearer " + token
        },
        // add the project_id
        data: JSON.stringify(farmerDataToQueu.pop())
      });
      compteur--;
    }

    if (compteur === length) {
      // empty the store
      clearFarmersData();
      // Clear queue after successful upload
      setFarmerDataToQueu([]);
      Alert.alert('Success', 'All data uploaded successfully');
    } else {
      // not all the project data were uploaded ? save the remaining projects data to store
      const notUploadedData = farmerDataToQueu.slice(0, compteur);
      setFarmerDataToQueu(notUploadedData);
      saveFarmersData(notUploadedData);
      Alert.alert('Success', ` ${compteur} data uploaded successfully`);
    }


  } catch (error) {
    console.error('Upload error:', error);
    Alert.alert('Error', 'Failed to upload data. Please try again later.');
  }
};


export const saveToQueue = (data: FarmerData, setFarmerDataToQueu: React.Dispatch<React.SetStateAction<FarmerData[]>>, setResetForm: React.Dispatch<React.SetStateAction<boolean>>, farmerDataToQueu: FarmerData[]) => {

  // save to store
  const { saveFarmersData } = useFarmerDataStore()
  console.log('\n\n farmer collected data: ', data);
  const newQueue = [...farmerDataToQueu, data];
  saveFarmersData(newQueue as FarmerData[]);
  setFarmerDataToQueu(newQueue as FarmerData[]);
  setResetForm(true); // Clear the form
  Alert.alert('Success', 'Farmer data saved to queue');
};

export const startLocationUpdates = async (
  isRecording: boolean,
  // addCoordinate: (location: Location.LocationObject) => void
) => {
  //     console.log("started startLocationUpdates function: ")
  //     if (watchPositionSubscription.current) {
  //         console.log("watchPositionSubscription: ", watchPositionSubscription.current)
  //         watchPositionSubscription.current.remove();
  //     }
  //     let compter = 0;
  //     console.log("value of isRecording: ", isRecording)
  //     watchPositionSubscription.current = await Location.watchPositionAsync(
  //         {
  //             accuracy: Location.Accuracy.BestForNavigation,
  //             distanceInterval: 5, // minimum change (in meters) before receiving a location update
  //             timeInterval: 5000, // minimum time to wait between each update (milliseconds)
  //         },
  //         (location) => {
  //             if (!isRecording) {
  //                 console.log("add cordinate new coordinate: ", compter++)
  //                 addCoordinate(location);
  //             }
  //         }
  //     );
};


// utils/calculations.ts

export function calculateNetWeight(
  weight: number,
  humidity: number,
  refraction: number
): number {
  // The net weight is typically the gross weight minus deductions for humidity and refraction
  // The exact formula may vary depending on industry standards or specific requirements
  // TODO: adjust as needed for your specific use case

  const humidityDeduction = weight * (humidity / 100);
  const refractionDeduction = weight * (refraction / 100);

  const netWeight = weight - humidityDeduction - refractionDeduction;

  console.log("from frunction file, netWeight: ", netWeight)

  // Round to two decimal places
  return Math.round(netWeight * 100) / 100;
}

export function calculateTotalPrice(
  netWeight: number,
  pricePerKg: number
): number {
  const totalPrice = netWeight * pricePerKg;

  console.log("from frunction file, totalPrice: ", Math.round(totalPrice * 100) / 100)
  // Round to two decimal places
  return Math.round(totalPrice * 100) / 100;
}

export const contentHtmlForReceipt = (
  data: Receipt,
  farmerSig: string,
  agentSig: string,
  salephoto: string,
  company_logo: string,
  compagny_name: string
) => {

  // Check if data is valid
  if (!data) {
    console.error('Invalid data provided');
    return;
  }



  // Generate HTML
  return `<html>
  <head>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        padding: 20px; 
      }
      h1 { 
        text-align: center; 
        margin-bottom: 40px; 
      }
      table { 
        width: 100%; 
        border-collapse: collapse;
        margin-top: 20px;
        }
      th, td { 
        border: 1px solid #cccccc;
        padding: 8px;
        text-align: left; 
     }
      th { 
         background-color: #f2f2f2;
       }

      /* Signature Box */
      .signature-box {
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
      }
      .signature {
        width: 45%;
        border-top: 1px solid black;
        text-align: center;
        padding-top: 10px;
      }

      /* Image Section */
      .image-section {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
      }
      .image-container {
        width: 30%;
        text-align: center;
      }
      .image-container img {
        max-width: 100%;
        
        border: 1px solid #cccccc;
      }
    </style>
  </head>
  <body>
   
<div> <img 
  src="${company_logo}" 
  alt="${marketProps?.company_name ?? 'company logo'}" 
  width="200" 
  height="100" 
  style="border: 1px solid #cccccc;" 
/>
        </div>
         <h1>Receipt Report for ${compagny_name}</h1>
    <table>
      <tr><th>Date</th><td>${data?.date?.toString() || "N/A"}</td></tr>
      <tr><th>Farmer ID</th><td>${data?.farmer_id || "N/A"}</td></tr>
      <tr><th>Farmer Name</th><td>${data?.farmer_name || "N/A"}</td></tr>
      <tr><th>Village</th><td>${data?.village || "N/A"}</td></tr>
      <tr><th>Market Number</th><td>${data?.market_number || "N/A"}</td></tr>
     
      <tr><th>Weight</th><td>${data?.weight || "N/A"}</td></tr>
      <tr><th>Humidity</th><td>${data?.humidity || "N/A"}</td></tr>
      <tr><th>Net Weight</th><td>${data?.net_weight || "N/A"}</td></tr>
      <tr><th>Net Weight</th><td>${data?.refraction || "N/A"}</td></tr>
      
      <tr><th>Price per KG</th><td>${data?.price_per_kg || "N/A"}</td></tr>
      <tr><th>Total Price</th><td>${data?.total_price || "N/A"}</td></tr>
      <tr><th>Agent Name</th><td>${data?.agent_name || "N/A"}</td></tr>
      <tr><th>Currency</th><td>${data?.currency || "N/A"}</td></tr>
      <tr><th>Product Name</th><td>${data?.product_name || "N/A"}</td></tr>
    </table>

     <!-- Image Section -->
    <div class="image-section">
      <div class="image-container">
        <p>Farmer's Photo with his product</p>
      <img 
        src="data:image/jpeg;base64,${salephoto}" 
        alt="Sale Photo" 
        width="200" 
        height="120"
      />
    </div>
      
    </div>
    <!-- Signature Section -->
    <div class="signature-box">
      <div class="signature">
        <p>Farmer's Signature</p>
         <img 
         src="data:image/jpeg;base64,${farmerSig}"
          alt="Farmer Signature" width="80" height="50"/>
      </div>
      <div class="signature">
        <p>Agent's Signature</p>
          <img src="data:image/jpeg;base64,${agentSig}"
          alt="Agent Signature" width="80" height="50"/>
      </div>
    </div>

   

  </body>
</html>
`;
};



export const contentHtmlForTransmission = (
  data: TransmissionForm,
  carrierSig: string,
  senderSig: string,
  ministrySig: string,
  company_logo: string,
  company_name: string,
) => {

  // Check if data is valid
  if (!data) {
    console.error('Invalid data provided');
    return;
  }
  console.log("inside content transmission html: ", data)
  // Generate HTML
  return `<html>
  <head>
    <style>
      body { 
        font-family: Arial, s
        ans-serif; 
        padding: 20px; 
      }
      h1 { 
        text-align: center; 
        margin-bottom: 40px; 
      }
      table { 
        width: 100%; 
        border-collapse: collapse;
        margin-top: 20px;
        }
      th, td { 
        border: 1px solid #cccccc;
        padding: 8px;
        text-align: left; 
     }
      th { 
         background-color: #f2f2f2;
       }

      /* Signature Box */
      .signature-box {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
      }
      .signature {
        width: 45%;
        border-top: 1px solid black;
        text-align: center;
        padding-top: 10px;
      }

      /* Image Section */
      .image-section {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
      }
      .image-container {
        width: 30%;
        text-align: center;
      }
      .image-container img {
        max-width: 100%;
        height: auto;
        border: 1px solid #cccccc;
      }
    </style>
  </head>
  <body>
  <div> <img 
  src="${company_logo}" 
  alt="${marketProps?.company_name ?? 'company logo'}" 
  width="100" 
  height="100" 
  style="border: 1px solid #cccccc;" 
/>
        </div>
    <h1>Transmission Report for ${data?.recipientName}</h1>
    
    <!-- Table Section -->
    <table>
    <tr><th>Market Number</th><td>${data?.marketNumber || "N/A"}</td></tr>
      <tr><th>Sender Name</th><td>${data?.senderName || "N/A"}</td></tr>
      <tr><th>Recipient Name</th><td>${data?.recipientName || "N/A"}</td></tr>
      <tr><th>Vehicle Registration</th><td>${data?.vehicleRegistration || "N/A"}</td></tr>
      <tr><th>Driver Name</th><td>${data?.driverName || "N/A"}</td></tr>
      <tr><th>Ministry Agent Name: </th><td>${data?.ministryAgentName || "N/A"}</td></tr>
      <tr><th>Number Of Bags</th><td>${data?.numberOfBags || "N/A"}</td></tr>
      <tr><th>Product Quality</th><td>${data?.productQuality || "N/A"}</td></tr>
    </table>

    <!-- Signature Section -->
    <div class="signature-box">
      <div class="signature">
        <p>Sender's Signature</p>
         <img src="data:image/jpg;base64,${senderSig}"
          alt="Farmer Signature" width="50px" height="50px/>
      </div>
      <div class="signature">
        <p>ministry's Signature</p>
           <img src="data:image/jpg;base64,${ministrySig}"
            alt="Farmer Signature" width="50px" height="50px"/>
      </div>
      <div class="signature">
        <p>Carrier's Signature</p>
                <img src="data:image/png;base64,${carrierSig}"
                 alt="Farmer Signature" width="50px" height="50px"/>
        </div>
      </div>
    </div>

  </body>
</html>
`;
};


export const generatePdf =
  async ({
    data,
    logo,
    contentHtml,
    filename,
    company_name,
    bucket_name
  }: {
    data: any,
    logo: string,
    contentHtml?: (data: any, str1: string, str2: string, str3: string, str4: string, company_name: string) => string | undefined,
    filename: string,
    company_name: string,
    bucket_name: string;
  }) => {


    let mediaFiles;

    let agentSignatureBase64, farmerSignatureBase64, salePhotoBase64, senderSignature, carrierSignature, ministrySignature;

    if (filename.includes('receipt')) {
      agentSignatureBase64 = await FileSystem.readAsStringAsync(data?.agent_signature, { encoding: FileSystem.EncodingType.Base64 });
      farmerSignatureBase64 = await FileSystem.readAsStringAsync(data?.farmer_signature, { encoding: FileSystem.EncodingType.Base64 });
      salePhotoBase64 = await FileSystem.readAsStringAsync(data?.salePhotoUrl, { encoding: FileSystem.EncodingType.Base64 });
      mediaFiles = contentHtml?.(
        data,
        // data?.agent_signature,
        agentSignatureBase64,
        // data?.farmer_signature,
        farmerSignatureBase64,
        salePhotoBase64,
        logo,
        company_name
      )
    }
    else if (filename.includes('transmission')) {
      // Convert the file URIs into base64 strings for embedding into the PDF

      senderSignature = await FileSystem.readAsStringAsync(data?.senderSignature, { encoding: FileSystem.EncodingType.Base64 });
      carrierSignature = await FileSystem.readAsStringAsync(data?.carrierSignature, { encoding: FileSystem.EncodingType.Base64 });
      ministrySignature = await FileSystem.readAsStringAsync(data?.ministrySignature, { encoding: FileSystem.EncodingType.Base64 });
      mediaFiles = contentHtml?.(
        data,
        carrierSignature,
        data?.senderSignature,
        ministrySignature,
        logo,
        company_name
      )
    }

    // Generate PDF

    // const iosUri = await Print.printToFileAsync({  // iOS only
    //   html: mediaFiles,
    // });
    const { uri } = await Print.printToFileAsync({ // android
      html: mediaFiles,
      base64: false,
    });

    // Before moving the file, confirm it exists using FileSystem.getInfoAsync:

    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error(`File not found at ${uri}`);
    }

    // Save PDF to specific path
    const pdfName = `${filename}_${Date.now()}`;
    const fileUri = `${FileSystem.documentDirectory}${pdfName}.pdf`;

    try {
      // await FileSystem.moveAsync({
      //   from: uri,
      //   to: fileUri,
      // });
      // Copy file to app's readable/writable location
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });
    } catch (error) {
      console.error('Error moving file:', error);
      throw new Error('Failed to move the generated PDF file.');
    }



    // make sure the file has been moved/copied to that place to be found by uploadToS3
    const fileUriInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileUriInfo.exists) {
      throw new Error(`File not found at ${fileUri}`);
    }

    const contentUri = await FileSystem.getContentUriAsync(fileUri);

    // store a copy of the file in s3
    // const uploadUrl = await uploadToS3(fileUri, `${filename}-${uri.split('/').pop()}`, bucket_name, 'application/pdf')

    console.log("contentUri: " + contentUri);
    // return { contentUri, uploadUrl, fileUri };
    return { contentUri, fileUri };
  };

//  export const shareFile = async (filePath: string) => {
//     try {
//       // Read file as base64
//       const base64File = await FileSystem.readAsStringAsync(filePath, {
//         encoding: FileSystem.EncodingType.Base64
//       });

//       const shareOptions = {
//         title: 'Share Receipt',
//         message: 'Check out this receipt',
//         url: `data:application/pdf;base64,${base64File}`,
//         type: 'application/pdf'
//       };

//       const result = await Share.open(shareOptions);
//       console.log('Share result:', result);
//     } catch (error) {
//       console.error('Error sharing file:', error);
//     }
//   };

export const generateAccompanyingPdf = async ({
  data,
  sheet,
  filename,
  logo,
  company_name,
  bucket_name
}: {
  data: any,
  sheet?: any,
  accompanyingHtmlStructure?: (sheet: AccompanyingSheet, receipts: Receipt[]) => string,
  filename: string,
  logo: string,
  company_name: string,
  bucket_name?: string
}) => {


  if (!data.length || !sheet)
    return console.log("fct file generata accpagyni pdf, NO data or sheet ");
  // const currentCompanyLogoBase64 =
  //   await FileSystem.readAsStringAsync(marketProps?.company_logo ?? logo, { encoding: FileSystem.EncodingType.Base64 });


  const contentHtml = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { color: #333; }
            .metadata { margin-bottom: 20px; }
            .metadata p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
        <h1> <img src="${logo}" alt=${marketProps?.company_name + " " + "logo"
    } style="width: 200px; height: 100px; border: 1px solid #cccccc" photo/>
        </h1>
        
          <h1>Accompanying Sheet for ${company_name}</h1>
        
    <table>
          <div class="metadata">
           <p><strong>Market Number:</strong> ${sheet?.marketNumber}</p>
            <p><strong>Level of Traceability:</strong> ${sheet?.levelOfTraceability
    }</p>
            <p><strong>Vehicle Number:</strong> ${sheet?.vehicleNumber}</p>
            <p><strong>Driver Name:</strong> ${sheet?.driverName}</p>
            <p><strong>Number of Bags Declared:</strong> ${sheet?.numberOfBagsDeclared
    }</p>
            <p><strong>Declared Net Weight:</strong> ${sheet?.declaredNetWeight
    }</p>
            <p><strong>Humidity:</strong> ${sheet?.humidity}</p>
           
          </div>
          <h2>Receipts</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Farmer Name</th>
              <th>Village</th>
              <th>Market Number</th>
              <th>Weight</th>
              <th>Humidity</th>
              <th>Net Weight</th>
              <th>Total Price</th>
              <th>Agent Name</th>
            </tr>
            ${data
      .map(
        (receipt: Receipt) => `
              <tr>
                <td>${receipt?.date.toString().split("T")[0]}</td>
                <td>${receipt?.farmer_name || receipt?.farmer?.farmer_name}</td>
                <td>${receipt?.village || receipt?.farmer?.village}</td>
                <td>${receipt?.market_id}</td>
                <td>${receipt?.weight}</td>
                <td>${receipt?.humidity}</td>
                <td>${receipt?.net_weight}</td>
                <td>${receipt?.total_price}</td>
                 <td>${receipt?.agent_name}</td>
              </tr>
            `
      )
      .join("")}
          </table>
        </body>
      </html>
    `;

  // Generate PDF

  // const iosUri = await Print.printToFileAsync({
  //   html: contentHtml,
  // });
  const { uri } = await Print.printToFileAsync({
    html: contentHtml,
    base64: false,
  });



  // Before moving the file, confirm it exists using FileSystem.getInfoAsync:

  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error(`File not found at ${uri}`);
  }

  // Save PDF to specific path
  const pdfName = `${filename}_${Date.now()}`;
  const fileUri = `${FileSystem.documentDirectory}${pdfName}.pdf`;

  try {
    await FileSystem.moveAsync({
      from: uri,
      to: fileUri,
    });
  } catch (error) {
    console.error('Error moving file:', error);
    throw new Error('Failed to move the generated PDF file.');
  }
  // Convert file:// URI to content:// URI to be visualized.
  const contentUri = await FileSystem.getContentUriAsync(fileUri);


  const fileUriInfo = await FileSystem.getInfoAsync(fileUri);
  if (!fileUriInfo.exists) {
    throw new Error(`File not found at ${fileUri}`);
  }

  const uploadedUrl = await uploadToS3(fileUri, `${filename}-${uri.split('/').pop()}`, bucket_name, 'application/pdf')
  return { contentUri, uploadedUrl, fileUri };
};


// Function to launch the print dialog
export const printPdf = async (fileUri: string) => {
  try {
    await Print.printAsync({ uri: fileUri });
    Alert.alert('Success', 'PDF sent to the printer');
  } catch (error) {
    Alert.alert('Error', 'Unable to print the PDF');
    console.error('Error printing PDF:', error);
  }
};

// const visualizePdf = async (uri: string) => {
//     if (Platform.OS === 'android') {
//         const contentUri = await getContentUriAsync(uri); // Convert file:// to content://

//         await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
//             data: contentUri,
//             type: 'application/pdf',
//             flags: 1, // FLAG_ACTIVITY_NEW_TASK
//         });
//     } else {
//         Linking.openURL(uri); // For iOS
//     }
// };

// const generatePDF = async () => {
//     try {
//       const html = generateHTML();
//       const { uri } = await Print.printToFileAsync({ html });

//       if (Platform.OS === "ios") {
//         await shareAsync(uri);
//       } else {
//         const contentUri = await Print.printToFileAsync({ html, base64: false });
//         await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
//           data: contentUri.uri,
//           flags: 1,
//           type: 'application/pdf',
//         });
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };


export const accompanyingHtmlStructure = (sheet: AccompanyingSheet,
  receipts: Receipt[]) => {
  return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { color: #333; }
            .metadata { margin-bottom: 20px; }
            .metadata p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Accompanying Sheet</h1>
          <div class="metadata">
            <p><strong>Level of Traceability:</strong> ${sheet.levelOfTraceability}</p>
            
            <p><strong>Declared Net Weight:</strong> ${sheet.declaredNetWeight}</p>
            <p><strong>Humidity:</strong> ${sheet.humidity}</p>
            <p><strong>Market Number:</strong> ${sheet.marketNumber}</p>
          </div>
          <h2>Receipts</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Farmer Name</th>
              <th>Village</th>
              <th>Market Number</th>
              <th>Weight</th>
              <th>Humidity</th>
              <th>Net Weight</th>
              <th>Total Price</th>
            </tr>
            ${receipts.map(receipt => `
              <tr>
                <td>${receipt.date}</td>
                <td>${receipt.farmer_name}</td>
                <td>${receipt.village}</td>
                <td>${receipt.market_number}</td>
                <td>${receipt.weight}</td>
                <td>${receipt.humidity}</td>
                <td>${receipt.net_weight}</td>
                <td>${receipt.total_price}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;
};



// Check if two line segments intersect
// const doSegmentsIntersect = (
//   p1: Coordinate,
//   p2: Coordinate,
//   p3: Coordinate,
//   p4: Coordinate
// ): boolean => {
//   // Convert to cartesian coordinates for simpler calculation
//   const ccw = (A: Coordinate, B: Coordinate, C: Coordinate): number => {
//     return (
//       (C.latitude - A.latitude) * (B.longitude - A.longitude) -
//       (B.latitude - A.latitude) * (C.longitude - A.longitude)
//     );
//   };

//   // Check if the line segments intersect
//   const intersect = (p1: Coordinate, p2: Coordinate, p3: Coordinate, p4: Coordinate): boolean => {
//     // First line segment is p1p2 and second line segment is p3p4
//     const a = ccw(p1, p2, p3);
//     const b = ccw(p1, p2, p4);
//     const c = ccw(p3, p4, p1);
//     const d = ccw(p3, p4, p2);

//     // Check if the line segments intersect
//     if ((a > 0 && b < 0 || a < 0 && b > 0) && (c > 0 && d < 0 || c < 0 && d > 0)) {
//       return true;
//     }

//     // Check for collinear segments that overlap
//     if (a === 0 && b === 0 && c === 0 && d === 0) {
//       // Project onto x-axis and y-axis and check for overlap
//       const overlap_x =
//         Math.max(p1.longitude, p2.longitude) >= Math.min(p3.longitude, p4.longitude) &&
//         Math.max(p3.longitude, p4.longitude) >= Math.min(p1.longitude, p2.longitude);
//       const overlap_y =
//         Math.max(p1.latitude, p2.latitude) >= Math.min(p3.latitude, p4.latitude) &&
//         Math.max(p3.latitude, p4.latitude) >= Math.min(p1.latitude, p2.latitude);

//       return overlap_x && overlap_y;
//     }

//     return false;
//   };

//   // Skip adjacent segments as they share a point
//   return intersect(p1, p2, p3, p4);
// };

// Enhanced self-intersection detection
const findSelfIntersection = (coordinates: Coordinate[]): { intersectionPoints: Coordinate[], problematicSegments: number[][] } | null => {
  const intersectionPoints: Coordinate[] = [];
  const problematicSegments: number[][] = [];

  for (let i = 0; i < coordinates.length - 3; i++) {
    for (let j = i + 2; j < coordinates.length - 1; j++) {
      // Skip adjacent segments
      if (j === i + 1) continue;

      // Check if non-adjacent segments intersect
      const intersection = findSegmentIntersection(
        coordinates[i],
        coordinates[i + 1],
        coordinates[j],
        coordinates[j + 1]
      );

      if (intersection) {
        intersectionPoints.push(intersection);
        problematicSegments.push([i, i + 1, j, j + 1]);
      }
    }
  }

  return intersectionPoints.length > 0
    ? { intersectionPoints, problematicSegments }
    : null;
};


// More precise intersection point calculation
const findSegmentIntersection = (
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate
): Coordinate | null => {
  const denom = (
    (p4.latitude - p3.latitude) * (p2.longitude - p1.longitude) -
    (p4.longitude - p3.longitude) * (p2.latitude - p1.latitude)
  );

  if (Math.abs(denom) < 1e-10) return null; // Lines are parallel

  const ua = (
    (p4.longitude - p3.longitude) * (p1.latitude - p3.latitude) -
    (p4.latitude - p3.latitude) * (p1.longitude - p3.longitude)
  ) / denom;

  const ub = (
    (p2.longitude - p1.longitude) * (p1.latitude - p3.latitude) -
    (p2.latitude - p1.latitude) * (p1.longitude - p3.longitude)
  ) / denom;

  // Check if intersection is within both line segments
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      latitude: p1.latitude + ua * (p2.latitude - p1.latitude),
      longitude: p1.longitude + ua * (p2.longitude - p1.longitude)
    };
  }

  return null;
};

// Calculate area of the polygon using shoelace formula
export const calculatePolygonArea = (coordinates: Coordinate[]): number => {
  const n = coordinates.length;
  let area = 0;

  for (let i = 0; i < n; i++) {
    const { latitude: x1, longitude: y1 } = coordinates[i];
    const { longitude: x2, latitude: y2 } = coordinates[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
};

// Modified area calculation to handle small variations
export const calculatePolygonAreaWithSmallVariation = (coordinates: Coordinate[]): number => {
  let area = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].longitude * coordinates[j].latitude;
    area -= coordinates[j].longitude * coordinates[i].latitude;
  }

  return Math.abs(area / 2);
};

// Calculate Area in Meters² using Turf.js
export const calculatePolygonAreaInMeters = (coordinates: Coordinate[]): number => {
  try {
    // Check if we have enough coordinates for a polygon
    if (coordinates.length < 3) {
      console.warn('Not enough coordinates to form a polygon');
      return 0;
    }

    // Create a copy of coordinates to avoid modifying the original array
    let polygonCoords = [...coordinates];

    // Check if polygon is closed (first and last points match)
    const firstPoint = coordinates[0];
    const lastPoint = coordinates[coordinates.length - 1];

    // Compare with some tolerance due to floating point precision
    const isPolygonClosed = Math.abs(firstPoint.latitude - lastPoint.latitude) < 0.0000001 &&
      Math.abs(firstPoint.longitude - lastPoint.longitude) < 0.0000001;

    // If not closed, add the first point to the end
    if (!isPolygonClosed) {
      polygonCoords.push(firstPoint);
    }

    // Convert coordinates to GeoJSON format [longitude, latitude]
    const geoJsonCoords = polygonCoords.map(coord => [coord.longitude, coord.latitude]);

    // Create a GeoJSON polygon
    const geojsonPolygon = turf.polygon([geoJsonCoords]);

    // Calculate area
    const areaInSquareMeters = turf.area(geojsonPolygon);

    // Round to 2 decimal places
    return Math.round(areaInSquareMeters * 100) / 100;

  } catch (error) {
    console.error('Error calculating polygon area:', error);
    return 0;
  }
};


// Threshold for considering two points as "same" (in degrees)
const DISTANCE_THRESHOLD = 0.00015; // roughly 15 meters at the equator
const MIN_AREA = 0.0000001; // Minimum area threshold
const MIN_POINTS = 3; // Minimum number of points needed for a valid polygon

// Check if two coordinates are close enough to be considered the same point
const arePointsEqual = (point1: Coordinate, point2: Coordinate): boolean => {
  return (
    Math.abs(point1.latitude - point2.latitude) < DISTANCE_THRESHOLD &&
    Math.abs(point1.longitude - point2.longitude) < DISTANCE_THRESHOLD
  );
};


/**
 * Calculates the distance between two coordinates using the most appropriate method
 * @param point1 First coordinate
 * @param point2 Second coordinate
 * @param options Configuration options for the calculation
 * @returns Distance in meters
 */
export const calculateDistance = (
  point1: Coordinate,
  point2: Coordinate,
  options: {
    highPrecision?: boolean;
    maxIterations?: number;
    convergenceThreshold?: number;
  } = {}
): number => {
  const {
    highPrecision = true,
    maxIterations = 100,
    convergenceThreshold = 1e-12
  } = options;

  // Use Haversine formula when:
  // 1. Points are near poles (above 89.5° or below -89.5° latitude)
  // 2. Points are nearly antipodal (almost exactly opposite sides of Earth)
  // 3. Points are very close to each other (< 1km)
  // 4. High precision is not required

  const isNearPoles = Math.abs(point1.latitude) > 89.5 || Math.abs(point2.latitude) > 89.5;
  const isNearlyAntipodal = Math.abs(Math.abs(point1.longitude - point2.longitude) - 180) < 0.1 &&
    Math.abs(point1.latitude + point2.latitude) < 0.1;

  // Quick distance check using simple coordinate difference
  const roughDistance = Math.sqrt(
    Math.pow(point1.latitude - point2.latitude, 2) +
    Math.pow(point1.longitude - point2.longitude, 2)
  ) * 111000; // Rough conversion to meters (1 degree ≈ 111km)

  console.log("\n\n roughDistance: ", roughDistance);
  console.log("\n\n isNearPoles: ", isNearPoles);
  console.log("\n\n isNearlyAntipodal: ", isNearlyAntipodal);

  if (isNearPoles || isNearlyAntipodal || !highPrecision || roughDistance < 1000) {
    console.log("calling the haversine fallback: ",)
    return fallbackHaversine(point1, point2);
  }

  // Try Vincenty formula first
  try {
    const vincentyResult = vincentyDistanceCalculation(
      point1,
      point2,
      maxIterations,
      convergenceThreshold
    );
    console.log("\n\n vincenty result: " + vincentyResult)
    // If Vincenty calculation succeeds, return the result
    if (!isNaN(vincentyResult) && isFinite(vincentyResult)) {
      return vincentyResult;
    }
  } catch (error) {
    console.warn('Vincenty calculation failed, falling back to Haversine');
  }

  // Fallback to Haversine if Vincenty fails
  return fallbackHaversine(point1, point2);
};

/**
 * Vincenty formula implementation for high-precision distance calculation
 */
const vincentyDistanceCalculation = (
  point1: Coordinate,
  point2: Coordinate,
  maxIterations: number,
  convergenceThreshold: number
): number => {
  // WGS-84 ellipsoid parameters
  const a = 6378137; // equatorial radius in meters
  const b = 6356752.314245; // polar radius in meters
  const f = 1 / 298.257223563; // flattening

  const φ1 = toRadians(point1.latitude);
  const φ2 = toRadians(point2.latitude);
  const λ1 = toRadians(point1.longitude);
  const λ2 = toRadians(point2.longitude);

  const L = λ2 - λ1;
  const tanU1 = (1 - f) * Math.tan(φ1);
  const tanU2 = (1 - f) * Math.tan(φ2);
  const cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1);
  const cosU2 = 1 / Math.sqrt(1 + tanU2 * tanU2);
  const sinU1 = tanU1 * cosU1;
  const sinU2 = tanU2 * cosU2;

  let λ = L;
  let iterations = 0;

  let sinλ, cosλ, σ, sinσ, cosσ, cos2σₘ, cos2α, C;

  do {
    sinλ = Math.sin(λ);
    cosλ = Math.cos(λ);
    const sinSqσ = (cosU2 * sinλ) * (cosU2 * sinλ) +
      (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) * (cosU1 * sinU2 - sinU1 * cosU2 * cosλ);

    if (sinSqσ === 0) return 0;

    sinσ = Math.sqrt(sinSqσ);
    cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
    σ = Math.atan2(sinσ, cosσ);
    const sinα = cosU1 * cosU2 * sinλ / sinσ;
    cos2α = 1 - sinα * sinα;
    cos2σₘ = cosσ - 2 * sinU1 * sinU2 / cos2α;

    if (isNaN(cos2σₘ)) cos2σₘ = 0;

    C = f / 16 * cos2α * (4 + f * (4 - 3 * cos2α));
    const λʹ = λ;
    λ = L + (1 - C) * f * sinα * (σ + C * sinσ * (cos2σₘ + C * cosσ * (-1 + 2 * cos2σₘ * cos2σₘ)));

    if (Math.abs(λ - λʹ) <= convergenceThreshold) {
      // Calculate final distance
      const uSq = cos2α * (a * a - b * b) / (b * b);
      const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
      const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
      const Δσ = B * sinσ * (cos2σₘ + B / 4 * (cosσ * (-1 + 2 * cos2σₘ * cos2σₘ) -
        B / 6 * cos2σₘ * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2σₘ * cos2σₘ)));

      const distance = b * A * (σ - Δσ);

      // Add altitude difference if available
      if (point1.altitude !== undefined && point2.altitude !== undefined) {
        const heightDiff = point2.altitude - point1.altitude;
        return Math.sqrt(distance * distance + heightDiff * heightDiff);
      }

      return distance;
    }
  } while (++iterations < maxIterations);

  throw new Error('Vincenty formula failed to converge');
};

/**
 * Haversine formula implementation for simpler distance calculation
 */
const fallbackHaversine = (point1: Coordinate, point2: Coordinate): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = toRadians(point1.latitude);
  const φ2 = toRadians(point2.latitude);
  const Δφ = toRadians(point2.latitude - point1.latitude);
  const Δλ = toRadians(point2.longitude - point1.longitude);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  // Add altitude difference if available
  if (point1.altitude !== undefined && point2.altitude !== undefined) {
    const heightDiff = point2.altitude - point1.altitude;
    return Math.sqrt(distance * distance + heightDiff * heightDiff);
  }

  return distance;
};

const toRadians = (degrees: number): number => degrees * Math.PI / 180;

// Enhanced polygon validation
export const validatePolygon = (coordinates: Coordinate[]): ValidationResult => {
  // Check minimum number of points
  if (coordinates.length < MIN_POINTS) {
    return {
      isValid: false,
      message: `At least ${MIN_POINTS} points are required to form a polygon`,
    };
  }

  // Check if polygon is closed
  const isPolygonClosed = arePointsEqual(
    coordinates[0],
    coordinates[coordinates.length - 1]
  );

  // if (!isPolygonClosed) {
  //   const distance = calculateDistance(
  //     coordinates[0],
  //     coordinates[coordinates.length - 1]
  //   );

  //   return {
  //     isValid: false,
  //     message: `Polygon is not closed. Distance between start and end points is ${Math.round(
  //       distance
  //     )} meters. Please complete the perimeter by returning to the starting point.`,
  //   };
  // }

  // Check for self-intersections
  for (let i = 0; i < coordinates.length - 3; i++) {
    for (let j = i + 2; j < coordinates.length - 1; j++) {
      // Skip adjacent segments
      if (j === i + 1) continue;

      // Check if non-adjacent segments intersect
      if (
        doSegmentsIntersect(
          coordinates[i],
          coordinates[i + 1],
          coordinates[j],
          coordinates[j + 1]
        )
      ) {
        return {
          isValid: false,
          message: "Polygon has crossing lines. Please ensure the perimeter doesn't intersect itself.",
        };
      }
    }
  }




  // Check minimum area
  const area = calculatePolygonArea(coordinates);
  if (area < MIN_AREA) {
    return {
      isValid: false,
      message: "Polygon area is too small. Please create a larger perimeter.",
    };
  }

  return {
    isValid: true,
    message: "Polygon is valid, closed, and properly formed",
  };
};

// Function to check if two line segments intersect
const doSegmentsIntersect = (
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  p4: Coordinate
): boolean => {
  const ccw = (A: Coordinate, B: Coordinate, C: Coordinate): boolean => {
    return (C.latitude - A.latitude) * (B.longitude - A.longitude) >
      (B.latitude - A.latitude) * (C.longitude - A.longitude);
  };

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4);
};

// Function to check for self-intersections in real-time
const checkForRealtimeIntersections = (
  coordinates: Coordinate[],
  newCoord: Coordinate
): { hasIntersection: boolean; intersectionPoints?: number[] } => {
  if (coordinates.length < 3) return { hasIntersection: false };

  // Create a new line segment from the last point to the new point
  const lastPoint = coordinates[coordinates.length - 1];

  // Check this new segment against all other segments except adjacent ones
  for (let i = 0; i < coordinates.length - 2; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];

    if (doSegmentsIntersect(lastPoint, newCoord, p1, p2)) {
      return {
        hasIntersection: true,
        intersectionPoints: [i, i + 1]
      };
    }
  }

  return { hasIntersection: false };
};

// Enhanced addCoordinate function with real-time validation
export const addCoordinateWithValidation = (
  location: Location.LocationObject,
  currentCoordinates: Coordinate[],
  onIntersectionDetected: (points: number[]) => void
): Coordinate | null => {
  const newCoord: Coordinate = {
    latitude: Number(location.coords.latitude.toFixed(7)),
    longitude: Number(location.coords.longitude.toFixed(7)),
    // accuracy: location.coords.accuracy as number,
    // timestamp: location.timestamp
  };

  // Check for minimum distance
  if (currentCoordinates.length > 0) {
    const lastCoord = currentCoordinates[currentCoordinates.length - 1];
    const distance = calculateDistance(lastCoord, newCoord);
    if (distance < 1) return null; // Too close to last point
  }

  // Check for intersections
  const intersectionCheck = checkForRealtimeIntersections(
    currentCoordinates,
    newCoord
  );

  if (intersectionCheck.hasIntersection) {
    onIntersectionDetected(intersectionCheck.intersectionPoints || []);
    return null;
  }

  return newCoord;
};

// debounce function 
export function debounce(func: (...args: any[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}


// Enhanced polygon validation with more detailed error information
export const enhancedValidatePolygon = (coordinates: Coordinate[]): ValidationResult => {
  // Check minimum number of points
  if (coordinates.length < 3) {
    return {
      isValid: false,
      message: "At least 3 points are required to form a polygon",
      errorType: 'insufficient_points'
    };
  }

  // Check for self-intersections with detailed error reporting
  const selfIntersectionResult = findSelfIntersection(coordinates);
  if (selfIntersectionResult) {
    return {
      isValid: false,
      message: "Polygon has crossing lines",
      errorType: 'self_intersection',
      errorDetails: {
        intersectionPoints: selfIntersectionResult.intersectionPoints,
        problematicSegments: selfIntersectionResult.problematicSegments
      }
    };
  }

  // Check if polygon is closed (with a small tolerance)
  const isPolygonClosed = arePointsEqual(
    coordinates[0],
    coordinates[coordinates.length - 1],
  );

  if (!isPolygonClosed) {
    const distance = calculateDistance(
      coordinates[0],
      coordinates[coordinates.length - 1]
    );

    return {
      isValid: false,
      message: `Polygon is not closed. Distance between start and end points is ${Math.round(distance)} meters.`,
      errorType: 'not_closed',
      errorDetails: {
        startPoint: coordinates[0],
        endPoint: coordinates[coordinates.length - 1],
        distance: distance
      }
    };
  }

  // Check minimum area
  // const area = calculatePolygonAreaWithSmallVariation(coordinates);
  const area = calculatePolygonArea(coordinates);
  console.log("\n\n area with small variation: ", area);
  if (area < MIN_AREA) {
    return {
      isValid: false,
      message: "Polygon area is too small",
      errorType: 'small_area'
    };
  }

  return {
    isValid: true,
    message: "Polygon is valid, closed, and properly formed"
  };
};

// amazon utility function 


const s3 = new AWS.S3({
  accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.EXPO_PUBLIC_AWS_REGION,
});

// helper function
export const isValidUrl = (urlString: string) => {
  console.log("\n incoming url string: ", urlString);
  try {
    return urlString?.toString().startsWith('http://') || urlString?.toString().startsWith('https://')
  } catch (error) {
    console.error("\n\n No valid url string")
    return false;
  }
};

export const uploadToS3 = async (localFilePath: string, key: string, bucketName?: string, contentType?: string) => {

  if (isValidUrl(localFilePath)) return localFilePath;  // skip valid Urls;

  if (!localFilePath || !key) {
    console.warn(`Skipping upload for invalid path: ${localFilePath}`);
    return localFilePath;
  }

  console.log("\n incoming url string inside uploadToS3: ", localFilePath);

  try {
    const base64File = await FileSystem.readAsStringAsync(localFilePath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileBuffer = Buffer.from(base64File, 'base64'); // Convert Base64 to binary
    const bucket = bucketName || <string>process.env.EXPO_PUBLIC_AWS_S3_BUCKET_NAME

    if (!bucket || !contentType) {
      throw new Error(`Bucket name ${bucket} or contentType ${contentType} is required`);
    }

    // Check if the bucket exists
    try {
      await s3.headBucket({ Bucket: bucket }).promise();
      console.log(`Bucket "${bucket}" already exists.`);
    } catch (error: any) {
      if (error.code === 'NotFound') {
        // Create the bucket if it doesn't exist
        console.log(`Bucket "${bucket}" not found. Creating bucket...`);
        await s3.createBucket({ Bucket: bucket }).promise();
      } else {
        throw new Error(`Error checking bucket existence: ${error.message}`);
      }
    }


    const params = {
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      // const contentType = contentType ?? mime.getType(localFilePath) || 'application/octet-stream';
      ContentType: contentType || 'application/octet-stream',
      // ACL: 'public-read', // This makes the file publicly accessible
    };

    await s3.upload(params).promise();
    return `https://${bucket}.s3.${process.env.EXPO_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};



function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-_]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}



const readFileAsBlob = async (uri: string): Promise<Blob> => {
  const fileBase64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const byteCharacters = atob(fileBase64); // Convert Base64 to binary
  const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));// charCodeAt Returns the Unicode value of the character at the specified location.
  const byteArray = new Uint8Array(byteNumbers);

  // Create a Blob from the binary data
  return new Blob([byteArray], { type: 'application/octet-stream' });
};


// oblige the user to enable location


export const requestLocationPermission = async () => {
  try {
    // Check if location services are enabled
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      Alert.alert(
        'Location Required',
        'Please enable location services to use this app.',
        [
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'android') {
                Linking.openSettings(); // Opens app settings on Android
              } else {
                Linking.openURL('App-Prefs:root=Privacy&path=LOCATION'); // Opens location settings on iOS
              }
            },
          },
        ]
      );
      throw new Error('Location services disabled');
    }

    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to use this app. Please grant permission in settings.',
        [
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      throw new Error('Location permission denied');
    }

    return true; // Location permission granted
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false; // Location permission not granted
  }
};


// Validation functions
export const validateFarmerName = (name: string) => {
  if (!name || name.trim().length < 2) {
    return "A name must be at least 2 characters long (minimum 2 caracteres)";
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return "A name can only contain letters, spaces, hyphens, and apostrophes (uniquement lettres, espace, tiret, apostrophes)";
  }
  return "";
};

// const phoneRegex = /^(\+237)?[12345678]\d{8}$/;
const phoneRegex = /^(?:\+237\d{9}|0237\d{9}|(64|65|66|67|68|69|62)\d{7}|22\d{7}|11\d{6})$/;
const idCardRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{9,17}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const validatePhoneNumber = (phone: string) => {
  // Validates Cameroon phone numbers (9 digits, optional country code)

  if (!phone || !phoneRegex.test(phone)) {
    return "Please enter a valid Cameroon phone number";
  }
  return "";
};

export const validateEmailAddress = (email: string) => {
  // Validates Cameroon email numbers (9 digits, optional country code)

  if (!email || !emailRegex.test(email)) {
    return "Please enter a valid Cameroon email address";
  }
  return "";
};

export const validateIDCardNumber = (id: string) => {

  // Validates Cameroon National ID format (typically 17 digits)
  if (!id || !idCardRegex.test(id)) {
    return "ID card number must be between 9 to 17 digits (seul 9 a 17 chiffres acceptes)";
  }
  return "";
};

// Validation rules
export const validateForm = (values: any, isNewFarmer: boolean): ValidationErrors => {
  const errors: ValidationErrors | any = {};

  // Common validations
  if (!values.agent_name?.trim()) {
    errors.agent_name = 'Agent name is required';
  }

  if (!values.weight
    // || isNaN(values.weight) 
    || Number(values.weight) <= 0) {
    errors.weight = 'Valid weight is required';
  }

  if (!values.humidity
    // || isNaN(values.humidity) 
    || Number(values.humidity) < 0 || Number(values.humidity) > 100) {
    errors.humidity = 'Humidity must be between 0 and 100';
  }

  if (!values.refraction
    // || isNaN(values.refraction) 
    || Number(values.refraction) < 0 || Number(values.refraction) > 100) {
    errors.refraction = 'Refraction must be between 0 and 100';
  }

  // New farmer specific validations
  if (isNewFarmer) {
    if (!values.farmer_name?.trim()) {
      errors.farmer_name = 'Farmer name is required';
    }

    if (!values.village?.trim()) {
      errors.village = 'Village is required';
    }

    if (!values.farmer_contact?.trim()) {
      errors.farmer_contact = 'Farmer contact is required';
    } else if (!phoneRegex.test(values.farmer_contact)) {
      errors.farmer_contact = 'Invalid phone number format';
    }

    if (!values.farmer_ID_card_number?.trim()) {
      errors.farmer_ID_card_number = 'ID card number is required';
    } else if (!idCardRegex.test(values.farmer_ID_card_number)) {
      errors.farmer_ID_card_number = 'Invalid ID card number format';
    }

    if (!values.inspector_contact?.trim()) {
      errors.inspector_contact = 'Inspector contact is required';
    } else if (!phoneRegex.test(values.inspector_contact)) {
      errors.inspector_contact = 'Invalid phone number format';
    }

    if (!values?.email?.trim())
      errors.email = 'Email is required';
    else
      errors.email = 'Invalid email address'
  }

  return errors;
};


// import * as Location from 'expo-location';
// import { Platform, Alert } from 'react-native';

const requestLocationPermissions = async () => {
  try {
    // First check if location services are enabled
    const serviceEnabled = await Location.hasServicesEnabledAsync();
    if (!serviceEnabled) {
      Alert.alert(
        "Location Services Disabled",
        "Please enable location services in your device settings to use this feature.",
        [{ text: "OK" }]
      );
      return false;
    }

    // Request foreground permissions first
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        "Permission Required",
        "This app needs location access to record plantation coordinates.",
        [{ text: "OK" }]
      );
      return false;
    }

    // For Android 10 (API level 29) and above, background permission must be requested separately
    if (Platform.OS === 'android' && Platform.Version >= 29) {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          "Background Location",
          "This app needs background location access to continue recording coordinates when the app is in the background. Please enable it in settings.",
          [{ text: "OK" }]
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    Alert.alert(
      "Error",
      "Failed to request location permissions. Please try again.",
      [{ text: "OK" }]
    );
    return false;
  }
};


export { requestLocationPermissions };


export const VALIDATION_PATTERNS = {
  PHONE: /^(?:\+237\d{9}|0237\d{9}|(64|65|66|67|68|69|62)\d{7}|22\d{7}|11\d{6})$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  ID_CARD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{9,17}$/,
  NUMERIC: /^\d*\.?\d*$/,
};

// Validation error messages
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  PHONE: 'Invalid phone number format. Must be Cameroon format (+237/237/6X/22)',
  EMAIL: 'Invalid email address format',
  ID_CARD: 'ID card number must be between 9-17 digits',
  NAME: 'Name must be at least 2 characters long',
  VILLAGE: 'Village name must be at least 2 characters long',
  INSPECTOR: 'Inspector name must be at least 2 characters long',
  SURFACE_AREA: 'Surface area must be a positive number',
  POSITIVE: 'Must be a positive number',
  PERCENTAGE: 'Must be between 0 and 100',
  NUMERIC: 'Must be a valid number',
};

type ValidatableReceiptField = keyof Omit<Receipt, 'id' | 'date' | 'time' | 'gpsLocation' | 'farmer'>;

export const validateMappingForm = (formData: any): ValidationResult => {
  const errors: Record<string, string> = {};

  // Required field validation
  const requiredFields = [
    'farmer_name',
    'farmer_contact',
    'farmer_ID_card_number',
    'collector_name',
    // 'inspector_contact',
    'village'
  ];

  requiredFields.forEach(field => {
    if (!formData[field as keyof typeof requiredFields]) {
      errors[field] = ERROR_MESSAGES.REQUIRED;
    }
  });

  // Name validations (farmer name)
  if (formData.farmer_name && formData.farmer_name.length < 2) {
    errors.farmer_name = ERROR_MESSAGES.NAME;
  }

  // Phone number validation (farmer contact)
  if (formData.farmer_contact && !VALIDATION_PATTERNS.PHONE.test(formData.farmer_contact)) {
    errors.farmer_contact = ERROR_MESSAGES.PHONE;
  }

  // ID card validation
  if (formData.farmer_ID_card_number && !VALIDATION_PATTERNS.ID_CARD.test(formData.farmer_ID_card_number)) {
    errors.farmer_ID_card_number = ERROR_MESSAGES.ID_CARD;
  }

  // inspector validations (inspector name)
  if (formData.collector_name && formData.collector_name.length < 2) {
    errors.collector_name = ERROR_MESSAGES.INSPECTOR;
  }

  // Phone number validation (inspector contact)
  // if (formData.inspector_contact && !VALIDATION_PATTERNS.PHONE.test(formData.inspector_contact)) {
  //   errors.inspector_contact = ERROR_MESSAGES.PHONE;
  // }

  // Village validation
  if (formData.village && formData.village.length < 2) {
    errors.village = ERROR_MESSAGES.VILLAGE;
  }

  // Numeric validations
  if (formData.surface_area && (isNaN(Number(formData.surface_area)) || Number(formData.surface_area) <= 0)) {
    errors.surface_area = ERROR_MESSAGES.SURFACE_AREA;
  }

  console.log('\n\n validation errors: ', errors)

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};


// Helper function to format error message for display
export const formatValidationError = (error: string): string => {
  return error.charAt(0).toUpperCase() + error.slice(1);
};

// Helper function to validate a single field
export const validateField = (fieldName: string, value: string | number): string | null => {

  // Handle empty values first
  if (!value) {
    return ERROR_MESSAGES.REQUIRED;
  }

  switch (fieldName) {
    case 'farmer_contact':
    case 'inspector_contact':
      return VALIDATION_PATTERNS.PHONE.test(String(value)) ? null : ERROR_MESSAGES.PHONE;

    case 'farmer_ID_card_number':
      return VALIDATION_PATTERNS.ID_CARD.test(String(value)) ? null : ERROR_MESSAGES.ID_CARD;

    case 'email':
      return VALIDATION_PATTERNS.EMAIL.test(String(value)) ? null : ERROR_MESSAGES.EMAIL;

    case 'farmer_name':
    case 'inspector_name':
    case 'collector_name':
      return (value as string).length >= 2 ? null : ERROR_MESSAGES.NAME;

    case 'village':
      return (value as string).length >= 2 ? null : ERROR_MESSAGES.VILLAGE;

    case 'weight':
    case 'price_per_kg':
    case 'declaredNetWeight':
    case 'numberOfBagsDeclared':
      if (!VALIDATION_PATTERNS.NUMERIC.test(String(value))) return ERROR_MESSAGES.NUMERIC;
      return Number(value) > 0 ? null : ERROR_MESSAGES.POSITIVE;

    case 'market_number':
    case 'market_id':
    case 'product_name':
    case 'currency':
      return value ? null : ERROR_MESSAGES.REQUIRED;

    case 'humidity':
    case 'refraction':
      if (!VALIDATION_PATTERNS.NUMERIC.test(String(value))) return ERROR_MESSAGES.NUMERIC;
      const num = Number(value);
      return num >= 0 && num <= 100 ? null : ERROR_MESSAGES.PERCENTAGE;

    case 'farmer_signature':
    case 'agent_signature':
      return value ? null : ERROR_MESSAGES.REQUIRED;

    case 'salePhotoUrl':
      return Array.isArray(value) && value.length > 0 ? null : ERROR_MESSAGES.REQUIRED;

    default:
      return value ? null : ERROR_MESSAGES.REQUIRED;
  }
};

export const validateReceiptField = (fieldName: string, value: string | number): string | null => {

  // Handle empty values first
  if (!value) {
    return ERROR_MESSAGES.REQUIRED;
  }

  switch (fieldName) {
    case 'farmer_contact':
    case 'inspector_contact':
      return VALIDATION_PATTERNS.PHONE.test(String(value)) ? null : ERROR_MESSAGES.PHONE;

    case 'farmer_ID_card_number':
      return VALIDATION_PATTERNS.ID_CARD.test(String(value)) ? null : ERROR_MESSAGES.ID_CARD;

    case 'email':
      return VALIDATION_PATTERNS.EMAIL.test(String(value)) ? null : ERROR_MESSAGES.EMAIL;

    case 'farmer_name':
    case 'collector_name':
    case 'inspector_name':
      return (value as string).length >= 2 ? null : ERROR_MESSAGES.NAME;

    case 'village':
      return (value as string).length >= 2 ? null : ERROR_MESSAGES.VILLAGE;

    case 'weight':
      if (!VALIDATION_PATTERNS.NUMERIC.test(String(value))) return ERROR_MESSAGES.NUMERIC;
      return Number(value) > 0 ? null : ERROR_MESSAGES.POSITIVE;

    case 'currency':
      return value ? null : ERROR_MESSAGES.REQUIRED;

    case 'humidity':
    case 'refraction':
      if (!VALIDATION_PATTERNS.NUMERIC.test(String(value))) return ERROR_MESSAGES.NUMERIC;
      const num = Number(value);
      return num >= 0 && num <= 100 ? null : ERROR_MESSAGES.PERCENTAGE;

    case 'farmer_signature':
    case 'agent_signature':
      return value ? null : ERROR_MESSAGES.REQUIRED;

    case 'salePhotoUrl':
      return Array.isArray(value) && value.length > 0 ? null : ERROR_MESSAGES.REQUIRED;



    default:
      return value ? null : ERROR_MESSAGES.REQUIRED;
  }
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .toLowerCase();
};
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Constants for batch processing
const BATCH_SIZE = 50; // Adjust based on your API limits
const MAX_RETRIES = 3; // Define your max retries
const RETRY_DELAY = 1000; // Define your retry delay in milliseconds

type UploadReceiptResult = {
  farmersCreated: number,
  totalFarmers: number,
  receiptsCreated: number,
  duplicatesSkipped: number,
  success: boolean
}

// Helper to split array into batches
const getBatches = <T>(items: T[], batchSize: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
};

// Helper for delayed retry
const uploadReceiptBatch = async (
  receipts: Receipt[],
  companyBucket: string,
  currentRetry: number = 0
): Promise<(any | null)> => {
  try {
    const uploadToS3WithRetry = async (file: string, key: string, bucket: string, contentType: string, retry = 0): Promise<string | null> => {
      try {
        return await uploadToS3(file, key, bucket, contentType);
      } catch (error) {
        console.error(`Upload failed for ${key}. Attempt ${retry + 1} of ${MAX_RETRIES}.`, error);
        if (retry < MAX_RETRIES) {
          await delay(RETRY_DELAY * (retry + 1));
          return uploadToS3WithRetry(file, key, bucket, contentType, retry + 1);
        }
        console.error(`Final failure for ${key}. Marking as failed.`);
        return null; // Mark as failed but do not block the process
      }
    };

    // Process and upload each receipt's files
    const processedReceipts = await Promise.all(
      receipts.map(async (receipt) => {
        try {
          const { salePhotoUrl, farmer_signature, agent_signature, farmer_name } = receipt;

          const uploadPhoto = async (photo: string) =>
            uploadToS3WithRetry(
              photo,
              `receipt-${farmer_name}-${photo.split('/').pop()}`,
              companyBucket,
              'image/jpeg'
            );

          const uploadSignature = async (signature: string, type: string) =>
            uploadToS3WithRetry(
              signature,
              `signature-${farmer_name}-${signature.split('/').pop()}`,
              companyBucket,
              'image/jpeg'
            );

          const uploadedPhotos = await Promise.all(salePhotoUrl?.map(uploadPhoto) || []);
          const uploadedFarmerSignature = await uploadSignature(farmer_signature, 'farmer');
          const uploadedAgentSignature = await uploadSignature(agent_signature, 'agent');

          return {
            ...receipt,
            salePhotoUrl: uploadedPhotos.filter(Boolean), // Remove null values
            farmer_signature: uploadedFarmerSignature || receipt.farmer_signature, // Keep original if failed
            agent_signature: uploadedAgentSignature || receipt.agent_signature, // Keep original if failed
          };
        } catch (error) {
          console.error(`Error processing receipt for farmer ${receipt.farmer_name}:`, error);
          return receipt; // Keep original receipt to ensure it is not lost
        }
      })
    );

    // Ensure we do not lose any data
    if (processedReceipts.length === 0) {
      console.warn('No receipts processed successfully.');
      return [];
    }

    // Bulk upload receipts to the database with exponential backoff
    const uploadToDatabaseWithRetry = async (values: { data: any[] }, attempt = 0): Promise<UploadReceiptResult | null> => {
      try { // call to api
        return await uploadResource('receipts/many', JSON.stringify(values));
      } catch (error) {
        console.error(`Bulk upload attempt ${attempt + 1} failed. Retrying...`, error);
        if (attempt < MAX_RETRIES) {
          // 📌 await delay(1000 * 2 ** attempt) doubles the wait time after each retry, preventing server overload and rate limits. 🚀
          await delay(1000 * 2 ** attempt); // Exponential backoff 
          return uploadToDatabaseWithRetry(values, attempt + 1);
        }
        console.error('Final bulk upload failure. Receipts will be stored for later retry.');
        return null;
      }
    };

    return await uploadToDatabaseWithRetry({ data: processedReceipts }); // Ensure all receipts are returned, even if DB upload failed

  } catch (error) {
    console.error('Critical failure in uploadReceiptBatch:', error);
    if (currentRetry < MAX_RETRIES) {
      await delay(RETRY_DELAY * (currentRetry + 1));
      return uploadReceiptBatch(receipts, companyBucket, currentRetry + 1);
    }
    throw error; // Only throw after exhausting all retries
  }
};

/**
 * sample of receipt data [
 * {
    "date": "2025-02-16T00:10:09.946Z",
    "farmer_name": "",
    "market_number": "cm42xj0ug000evi92egj5e85g",
    "gpsLocation": {
      "longitude": 11.4990567,
      "latitude": 3.84542
    },
    "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image1382870655241845598.png",
    "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image7679919763011751103.png",
    "weight": "15000",
    "humidity": "5",
    "refraction": "9",
    "net_weight": 12900,
    "price_per_kg": 3175,
    "total_price": 40957500,
    "agent_name": "Toto Guillaume ",
    "currency": "XAF",
    "product_name": "COCOA",
    "salePhotoUrl": [
      "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt--a3cd51c1-73a6-4f21-b902-b0184b20a6b2.jpeg"
    ],
    "market_id": "cm42xj0ug000evi92egj5e85g",
    "village": "Yaoundé, Cameroon",
    "farmer": {
      "farmer_name": "Njangui mathurin",
      "village": "Nitoukou ",
      "farmer_contact": "675789939",
      "farmer_ID_card_number": "1234747478",
      "inspector_contact": "674747488",
      "location": "Yaoundé, Cameroon"
    }
  },
  {
    "date": "2025-02-16T00:50:26.143Z",
    "farmer_id": "cm76uck6y000fjz2a0833e2is",
    "farmer_name": "Matada",
    "village": "Yaoundé, Cameroon",
    "market_number": "cm42xj0ug000evi92egj5e85g",
    "gpsLocation": {
      "longitude": 11.4990567,
      "latitude": 3.84542
    },
    "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature-Matada-ReactNative-snapshot-image1528921049009483382.png",
    "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature-Matada-ReactNative-snapshot-image4455700918092239843.png",
    "weight": "3698",
    "humidity": "1",
    "refraction": "2",
    "net_weight": 3587.06,
    "price_per_kg": 3175,
    "total_price": 11388915.5,
    "agent_name": "Cherlock holm",
    "currency": "XAF",
    "product_name": "COCOA",
    "salePhotoUrl": [
      "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt-Matada-88c4aa05-f8e4-49c7-ac21-685fe0d9ee6b.jpeg"
    ],
    "market_id": "cm42xj0ug000evi92egj5e85g"
  }
 * ]
 */

export const uploadAccompanyingSheetData = async (
  receipts: Receipt[],
  transactionData: any,
  companyBucket: string
) => {
  try {

    const receiptBatches = getBatches(receipts, BATCH_SIZE); // break the list of receipt into batch of 50 items
    let uploadedReceipts: any[] = [];
    let failedReceipts: number[] = [];

    for (let i = 0; i < receiptBatches.length; i++) {
      try {

        await delay(500); // delay each batch upload
        const batchResults = await uploadReceiptBatch(receiptBatches[i], companyBucket);

        if (batchResults?.success) { // if the batch was successfully uploaded, we add it to the main array
          uploadedReceipts = [...uploadedReceipts, ...receiptBatches];
        } else {
          failedReceipts.push(i * BATCH_SIZE);
        }

      } catch (error) {
        console.error(`Failed to upload batch ${i}:`, error);
        // Mark all receipts in this batch as failed
        for (let j = 0; j < receiptBatches[i].length; j++) {
          failedReceipts.push(i * BATCH_SIZE + j);
        }
      }
    }


    if (uploadedReceipts.length > 0) {
      const updatedTransactionData = {
        ...transactionData,
        number_of_receipts: String(uploadedReceipts.length),
        upload_status: failedReceipts.length === 0 ? 'complete' : 'partial'
      };

      const transaction = await uploadResource('transactions', updatedTransactionData);
      console.log('transaction data:', transaction);

      return {
        success: true,
        transactionId: transaction?.id,
        data: transaction,
        failedReceipts: failedReceipts.length > 0 ? failedReceipts : undefined
      };
    }

    throw new Error('No receipts were successfully uploaded');
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};