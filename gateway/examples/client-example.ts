import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:3000/api';
const API_KEY = ''; 
const TO_MINT = "1000000000000"; 
const ADDRESS = "0x523dda1e177405c8d2a17b9fdb61e757f8b7a9fe01c281ff1329f5a38721a755"

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json'
    }
});

function logResponse(title: string, data: any) {
    console.log('\n' + '='.repeat(60));
    console.log(title);
    console.log('='.repeat(60));
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(60) + '\n');
}

function handleError(error: unknown, context: string) {
    console.error(`\n❌ Error in ${context}:`);
    
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
            console.error('Status:', axiosError.response.status);
            console.error('Data:', axiosError.response.data);
        } else if (axiosError.request) {
            console.error('No response from server');
        } else {
            console.error('Error:', axiosError.message);
        }
    } else {
        console.error(error);
    }
}

async function healthCheck() {
    try {
        const response = await client.get('/health');
        logResponse('✅ HEALTH CHECK', response.data);
        return true;
    } catch (error) {
        handleError(error, 'Health Check');
        return false;
    }
}

async function createProgram(name: string, symbol: string, adminAddress: string, mintTo: string) {
    try {
        const programData = {
            admins: [adminAddress],
            name: name,
            symbol: symbol,
            decimals: 18,
            mint_amount: TO_MINT, 
            mint_to: mintTo
        };

        console.log(`\n- Creating program: ${name} (${symbol})`);
        console.log(JSON.stringify(programData, null, 2));

        const response = await client.post('/create-program', programData);
        logResponse(`✅ PROGRAM CREATED: ${name}`, response.data);
        
        const tokenAddress = response.data.data.programCreated?.address;
        return { success: true, tokenAddress, data: response.data };
    } catch (error) {
        handleError(error, `Create Program ${name}`);
        return { success: false, tokenAddress: null, data: null };
    }
}

async function createPool(tokenA: string, tokenB: string) {
    try {
        const poolData = {
            token_a: tokenA,
            token_b: tokenB
        };

        console.log('\n- Creating pool with CreatePool:');
        console.log(`  Token A: ${tokenA}`);
        console.log(`  Token B: ${tokenB}`);

        const response = await client.post('/create-pool', poolData);
        logResponse('✅ POOL CREATED', response.data);
        
        return { 
            success: true, 
            pairAddress: response.data.data.pairAddress,
            alreadyExists: response.data.data.alreadyExists || false
        };
    } catch (error) {
        handleError(error, 'Create Pool');
        return { success: false, pairAddress: null, alreadyExists: false };
    }
}

async function createPoolWithRegisteredToken(token: string, registeredToken: string | null = null) {
    try {
        const poolData: any = {
            token: token,
            registered_token: registeredToken
        };

        console.log('\n- Creating pool with CreatePoolWithRegisteredToken:');
        console.log(`  Token: ${token}`);
        console.log(`  Registered Token: ${registeredToken || 'null (will use default)'}`);

        const response = await client.post('/create-pool-with-registered-token', poolData);
        logResponse('✅ POOL WITH REGISTERED TOKEN CREATED', response.data);
        
        return { 
            success: true, 
            pairAddress: response.data.data.pairAddress,
            alreadyExists: response.data.data.alreadyExists || false
        };
    } catch (error) {
        handleError(error, 'Create Pool with Registered Token');
        return { success: false, pairAddress: null, alreadyExists: false };
    }
}

async function getPairAddress(tokenA: string, tokenB: string) {
    try {
        const response = await client.get('/pair-address', {
            params: {
                token_a: tokenA,
                token_b: tokenB
            }
        });
        
        logResponse('✅ PAIR ADDRESS QUERY', response.data);
        
        return { 
            success: true, 
            exists: response.data.data.exists,
            pairAddress: response.data.data.pairAddress
        };
    } catch (error) {
        handleError(error, 'Get Pair Address');
        return { success: false, exists: false, pairAddress: null };
    }
}

async function getAllPairs() {
    try {
        const response = await client.get('/all-pairs');
        logResponse('✅ ALL PAIRS', response.data);
        return response.data;
    } catch (error) {
        handleError(error, 'Get All Pairs');
        return null;
    }
}

async function getFeeTo() {
    try {
        const response = await client.get('/fee-to');
        logResponse('✅ FEE TO', response.data);
        return response.data;
    } catch (error) {
        handleError(error, 'Get Fee To');
        return null;
    }
}

async function getTreasuryId() {
    try {
        const response = await client.get('/treasury-id');
        logResponse('✅ TREASURY ID', response.data);
        return response.data;
    } catch (error) {
        handleError(error, 'Get Treasury ID');
        return null;
    }
}

async function getNumber() {
    try {
        const response = await client.get('/number');
        logResponse('✅ TOTAL PROGRAMS', response.data);
        return response.data;
    } catch (error) {
        handleError(error, 'Get Number');
        return null;
    }
}

async function getAdmins() {
    try {
        const response = await client.get('/admins');
        logResponse('✅ ADMINS', response.data);
        return response.data;
    } catch (error) {
        handleError(error, 'Get Admins');
        return null;
    }
}

async function getPoolFactoryAddress() {
    try {
        const response = await client.get('/pool-factory-address');
        logResponse('✅ POOL FACTORY ADDRESS', response.data);
        return response.data;
    } catch (error) {
        handleError(error, 'Get Pool Factory Address');
        return null;
    }
}

async function completeWorkflowTest() {
    const ADMIN_ADDRESS = ADDRESS;
    const MINT_TO_ADDRESS = ADDRESS;

    console.log('- Create First VFT Token');
    
    const token1 = await createProgram('Token Alpha', 'ALPHA', ADMIN_ADDRESS, MINT_TO_ADDRESS);
    if (!token1.success) {
        console.log('❌ Failed to create Token 1. Aborting workflow.');
        return;
    }
    console.log(`✅ Token 1 created: ${token1.tokenAddress}`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('- Create Second VFT Token');
    
    const token2 = await createProgram('Token Beta', 'BETA', ADMIN_ADDRESS, MINT_TO_ADDRESS);
    if (!token2.success) {
        console.log('❌ Failed to create Token 2. Aborting workflow.');
        return;
    }
    console.log(`✅ Token 2 created: ${token2.tokenAddress}`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('- Create Pool with CreatePool (Token 1 + Token 2)');
    
    const pool1 = await createPool(token1.tokenAddress!, token2.tokenAddress!);

    if (pool1.success) {
        console.log(`✅ Pool 1 created: ${pool1.pairAddress}`);
        console.log(`   Token A: ${token1.tokenAddress}`);
        console.log(`   Token B: ${token2.tokenAddress}`);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('- STEP 4: Verify Pool 1 Exists');
    
    const checkPool1 = await getPairAddress(token1.tokenAddress!, token2.tokenAddress!);

    if (checkPool1.exists) {
        console.log(`✅ Pool 1 verified: ${checkPool1.pairAddress}`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('- Create Third VFT Token');
    
    const token3 = await createProgram('Token Gamma', 'GAMMA', ADMIN_ADDRESS, MINT_TO_ADDRESS);
    if (!token3.success) {
        console.log('❌ Failed to create Token 3. Aborting workflow.');
        return;
    }
    console.log(`✅ Token 3 created: ${token3.tokenAddress}`);

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('- Create Pool with CreatePoolWithRegisteredToken');
    
    const pool2 = await createPoolWithRegisteredToken(token3.tokenAddress!, null);

    if (pool2.success) {
        console.log(`✅ Pool 2 created: ${pool2.pairAddress}`);
        console.log(`   Token: ${token3.tokenAddress}`);
        console.log(`   Registered Token: TVARA`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n' + '═'.repeat(60));
    console.log('SUMMARY:');
    console.log('═'.repeat(60));
    console.log(`Token Alpha (ALPHA): ${token1.tokenAddress}`);
    console.log(`Token Beta (BETA):   ${token2.tokenAddress}`);
    console.log(`Token Gamma (GAMMA): ${token3.tokenAddress}`);
    console.log(`Pool 1 (ALPHA/BETA): ${pool1.pairAddress}`);
    console.log(`Pool 2 (GAMMA/Default): ${pool2.pairAddress}`);
}

async function queryTests() {
    console.log('\n' + '📊 '.repeat(30));
    console.log('QUERY TESTS (NO GAS REQUIRED)');
    console.log('📊 '.repeat(30) + '\n');

    await getNumber();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await getAdmins();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await getPoolFactoryAddress();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // await getAllPairs();
    // await new Promise(resolve => setTimeout(resolve, 500));
    
    await getFeeTo();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await getTreasuryId();
}

async function main() {
    const isHealthy = await healthCheck();
    if (!isHealthy) {
        console.log('\n❌ Server is not available. Make sure it is running.');
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    await queryTests();

    await completeWorkflowTest();

    console.log('TESTS COMPLETED');
}

main().catch(error => {
    console.error('Error in main:', error);
    process.exit(1);
});
