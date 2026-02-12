
// import lib
import { useSignIn } from '@clerk/clerk-expo';

// import the client library
import { AppError } from '@/utils/error-class';
import { API_URL } from '../constants/constants';
import { tokenCache } from '@/store/persist-token-cache';
import axios from 'axios';
import { Farmer, Market, Project } from '@/interfaces/types';


// getthe current user
export const getAllFarmersOfThisLocation = async (location: string = '') => {


    console.log("location to fetch the farmers: ", location)
    const token = await tokenCache.getToken("token");
    try {

        // we specify the fone here bacause it is usecin the controller for phone validation response
        const options = {
            method: 'GET',
            url: `${API_URL}/v1/farmers?location=${location}&phone=${true}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
        }

        const response = await axios.request(options);
        console.log("\n\nfrom api file getAllFarmersOfThisLocation " + location + " fct", response?.data);

        return response.data;

    } catch (error: any) {
        console.error(`from api file. Error fetching all farmers data : ${error}`);
        throw new AppError(error.message);
    }
}

// get all created and assigned markets
export const getAssignedMarket = async (): Promise<Market | null> => {

    try {
        return (await getAllAssignedProjects<Market[]>('markets'));

    } catch (error: any) {
        console.error(`from api file. Error fetching markets data : ${error}`);
        throw new AppError(error.message);
    }
}

// get the projects assigned to an agent

export const getAllProjectsAssignedToAgent = async (resource: string) => {

    const allProjects = await getAllAssignedProjects<any[]>(resource);
    if (!allProjects) {
        console.error(`from api file. Error fetching ${resource} data : ${allProjects?.error}`);
        throw new AppError(allProjects?.error);
    }

    // dispatch each project type to its category. management (inspections, mapping), training and markets
    const { inspections, mappings, trainings, markets } = allProjects;

    console.log("\n\n from api file getAllProjectsAssignedToAgent: ", { inspections, mappings, trainings, markets });

    return allProjects;
};

// get all assigned projects

export const getAllAssignedProjects = async <T = any>(resource: string, type: string = ''): Promise<T[] | null | any> => {

    const agentCode = await tokenCache.getToken("user_code");
    const token = await tokenCache.getToken("token");
    if (!token || !agentCode || !resource) {
        console.log({ token, agentCode, resource });
        console.log("from api fileAPI_URL at getAllAssignedProjects");
        return console.error('\n\n INVALID CREDENTIALS');
    }

    let query = '', requestUrl = '';
    if (type) {
        query = `&type=${type}`
        requestUrl = `${API_URL}/v1/${resource}?agentCode=${agentCode.trim()}${query.trim()}`;
    } else requestUrl = `${API_URL}/v1/${resource}?agentCode=${agentCode.trim()}`;

    console.log("from api file API_URL: ", `${API_URL}/v1/${resource}?agentCode=${agentCode}${query.trim()}`);

    try {
        const options = {
            method: 'GET',
            url: requestUrl,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
        };

        const response = await axios.request(options);
        // console.log("\n\nfrom api file getAllAssignedProjects fct", response?.data);

        return response?.data?.data;
    } catch (error: any) {
        console.error(`from api file. Error fetching project data : ${error}`);
        throw new AppError(error.message);
    }
}


export const getProjectById = async (project_id: string) => {

    try {
        return await fetchResourceByItsID<Project>('projects', project_id)
    } catch (error: any) {
        console.error(`from api file. Error fetching project data : ${error}`);
        throw new AppError(error.message);
    }
}

export const fetchResourceByItsID = async <T = any>(resource: string, res_id: string = ''): Promise<T | null | any> => {


    const token = await tokenCache.getToken("token");
    console.log("agent: ", token);


    const agentCode = await tokenCache.getToken("user_code");
    console.log("from api file API_URL: ", `${API_URL}/v1/${resource}/${res_id}`);
    try {
        if (!token || !resource) {
            console.log("from api file API_URL at fetchResourceByItsID \n");
            return console.error('\n\n INVALID CREDENTIALS');
        }
        const options = {
            method: 'GET',
            url: `${API_URL}/v1/${resource}/${res_id}`,
            headers: {
                'Authorization': `Bearer ${token} `,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
        }

        const response = await axios.request(options);
        console.log(`form api file, fetchResourceByItsID fct for resource ${resource} : `, response?.data);

        return response.data;
    } catch (error: any) {
        console.error(`from api file.Error fetching market data: ${error} `);
        throw new AppError(error.message);
    }
}


// fetch user markets
export const getTrainingProject = async (training_id: string) => {

    try {
        return await fetchResourceByItsID('trainings', training_id);
    } catch (error: any) {
        console.error(`from api file.Error fetching training project data by its ID: ${error} `);
        throw new AppError(error.message);
    }
}

export const getAllTrainingsProjects = async () => {
    console.log("\n\n\ncalled")
    try {
        // return await getAllAssignedProjects('trainings')
        return (await getAllProjectsAssignedToAgent('trainings'))?.trainings;
    } catch (error: any) {
        console.error(`from api file getAllTrainingsProject. Error fetching project training: ${error} `);
        throw new AppError(error.message);
    }
}

export const getAllMappingProjects = async () => {

    try {
        // const data = await getAllAssignedProjects('projects');
        // console.log("from api file getAllMappingProjects all projects data: ", data.data);
        return (await getAllProjectsAssignedToAgent('trainings'))?.mappings;
    } catch (error: any) {
        console.error(`from api file getAllMappingProjects. Error fetching project training: ${error} `);
        throw new AppError(error.message);
    }
}

export const getAllInspectionsProjects = async () => {

    try {
        // const data = await getAllAssignedProjects('projects');

        // console.log("from api file getAllInspectionsProjects all projects data: ", data);
        return (await getAllProjectsAssignedToAgent('trainings'))?.inspections;
    } catch (error: any) {
        console.error(`from api file getAllInspectionsProjects. Error fetching project inspection: ${error} `);
        throw new AppError(error.message);
    }
}


export const uploadResource = async <T>(
    resource: string,
    values: T,
    type: string = ''
): Promise<T | null | any> => {
    // console.log("selected values data: ", values);

    let query = ''; // help to differentiate project in the server for specifying workers
    if (type)
        query = `?type=${type}`


    // console.log("\n\n value to upload: ", JSON.stringify(values));

    try {
        const token = await tokenCache.getToken("token");
        if (!token || !resource) {
            console.log("from api file API_URL at fetchResourceByItsID \n");
            return console.error('\n\n INVALID CREDENTIALS FOR UPLOAD');
        }
        const options = {
            method: 'POST',
            url: `${API_URL}/v1/${resource}${query ? query : ''}`, // add query only if type is added
            headers: {
                'Authorization': `Bearer ${token} `,
                'Content-Type': 'application/json',
            },
            data: values,
        }

        const response = await axios.request(options)
        console.log(`from api file, uploadResource fct for resource ${resource} : `, response?.data);
        if (response.data?.status === 201 || response.data?.data) {
            return response?.data?.data;
        }
        return null
    } catch (error: any) {
        console.error(`from uploadResource api file. Error Uploading ${resource} data: ${error} `);
        if (error?.message.include === '')
            throw new AppError(error.message);
    }
}


export const updateResource = async <T>(
    resource: string,
    values: T,
    id: string
): Promise<T | null | any> => {
    console.log("selected values data: ", values);

    try {
        const token = await tokenCache.getToken("token");
        if (!token || !resource || !id) {
            console.error("from api file API_URL at fetchResourceByItsID \n");
            return console.error('\n\n INVALID CREDENTIALS FOR UPLOAD: ', { token, resource, id });
        }
        const options = {
            method: 'PATCH',
            url: `${API_URL}/v1/${resource}/${id}`, // add query only if type is added
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json', // Change this
            },
            data: values
        }

        const response = await axios.request(options);
        console.log(`from api file, updateResource fct for resource ${resource} : `, response?.data);
        if (response.data?.data) {
            return response?.data?.data;
        }
        return null
    } catch (error: any) {
        console.error(`from api file.Error Uploading ${resource} data: ${error} `);
        if (error?.message.include === '')
            throw new AppError(error.message);
    }
}
export async function getCurrentCampaign() {
    try {
        return await fetchResourceByItsID('campaigns', 'current')
    } catch (error: any) {
        console.error(`from api file.Error fetching current campaign : ${error} `);
        throw new AppError(error.message);
    }
}

export async function getCompanyFarmers() {
    try {
        return await fetchResourceByItsID<Farmer[]>('farmers', 'phone') ?? [];
    } catch (error: any) {
        console.error(`from api file.Error fetching farmers : ${error} `);
        throw new AppError(error.message);
    }
}


// fetch farmers by name
export const fetchFarmersByName = async (query: string) => {
    try {
        const token = await tokenCache.getToken("token");
        if (!token || query == undefined) {
            console.log("from api file API_URL at fetchFarmersByName \n");
            return console.error('\n\n INVALID CREDENTIALS , CANNOT FETCH FARMERS BY NAME');
        }

        const options = {
            method: 'GET',
            url: `${API_URL}/v1/farmers?name=${query}&phone=${true}`, // get farmers from the dropdown list.
            headers: {
                'Authorization': `Bearer ${token} `,
                'Content-Type': 'application/json, multipart/form-data',
                Accept: 'application/json'
            },
        }

        const response = await axios.request(options);
        console.log(`form api file, fetchFarmersByName fct  : `, response?.data);
        if (response.data?.status === 200) {
            return response?.data?.data;
        }
        return null
    } catch (error) {
        console.error('Error fetching farmers:', error);
        return [];
    }
};