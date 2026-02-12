import React from 'react';
import { Text } from 'react-native';

type ReceiptFormData = {
    id?: string;
    producerCode: string;
    producerName: string;
    village: string;
    market_number: string;
    buyer: string;
    weight: string;
    humidity: string;
    refraction_percentage: string;
    pricePerKg: string;
};

interface ReceiptDataTableProps {
    data: ReceiptFormData[];
}

const ReceiptDataTable: React.FC<ReceiptDataTableProps> = ({ data }) => {
    const headers: (keyof ReceiptFormData)[] = [
        'producerCode',
        'producerName',
        'village',
        'market_number',
        'buyer',
        'weight',
        'humidity',
        'refraction_percentage',
        'pricePerKg',
    ];

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead>
                    <tr className="bg-gray-200">
                        {headers.map((header) => (
                            <th key={header} className="py-2 px-4 border border-gray-300 font-bold text-left">
                                <Text> {header}</Text>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.id}>
                            {headers.map((header) => (
                                <td key={`${row.id}-${header}`} className="py-2 px-4 border border-gray-300">
                                    <Text>{row[header]}</Text>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Example usage
// const ExampleUsage: React.FC = () => {
//     const sampleData: ReceiptFormData[] = [
//         {
//             id: '1',
//             producerCode: 'PC001',
//             producerName: 'John Doe',
//             village: 'Village A',
//             market_number: 'W001',
//             buyer: 'Buyer 1',
//             weight: '100',
//             humidity: '10%',
//             refraction: '5%',
//             pricePerKg: '2.5',
//         },
//         {
//             id: '2',
//             producerCode: 'PC002',
//             producerName: 'Jane Smith',
//             village: 'Village B',
//             market_number: 'W002',
//             buyer: 'Buyer 2',
//             weight: '150',
//             humidity: '12%',
//             refraction: '4%',
//             pricePerKg: '2.7',
//         },
//         // Add more sample data as needed
//     ];

//     return (
//         <div className="p-4">
//             <h2 className="text-2xl font-bold mb-4">Receipt Data</h2>
//             <ReceiptDataTable data={sampleData} />
//         </div>
//     );
// };

export default ReceiptDataTable;