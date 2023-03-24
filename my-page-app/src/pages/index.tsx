import {Inter} from 'next/font/google'
import {useAuthContext} from '@/context/auth';
import RequireAuth from '../components/auth/RequireAuth';
import BudgetContainer from '../components/budget/BudgetContainer';

const inter = Inter({subsets: ['latin']})


export default function Home() {
    const [isAuthenticated, setIsAuthenticated, user, setUser] = useAuthContext();

    return (
        <RequireAuth>
            <BudgetContainer user={user}/>
        </RequireAuth>
    );
}
