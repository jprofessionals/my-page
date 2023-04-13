import type { NextPage } from 'next';
import Head from 'next/head';
import {
    useQuery,
    useMutation,
    useQueryClient,
    QueryClient,
    QueryClientProvider,
} from 'react-query'

import  ApiService   from '@/services/api.service';

const queryClient = new QueryClient()

const AdminTest: NextPage = () => {
    return (
        <div>
            <Head>
                <title>Hello, World!</title>
                <meta name="description" content="A simple Hello, World! page using Next.js and TypeScript" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main>
                <h1>Hello, World!</h1>
            </main>
        </div>
    );
};

export default AdminTest;