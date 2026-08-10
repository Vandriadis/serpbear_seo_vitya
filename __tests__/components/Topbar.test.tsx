import { render, screen } from '@testing-library/react';
import TopBar from '../../components/common/TopBar';
import { ThemeProvider } from '../../hooks/useTheme';
import { renderWithClient } from '../../__mocks__/utils';

jest.mock('next/router', () => ({
   useRouter: () => ({
      pathname: '/',
      asPath: '/',
      push: jest.fn(),
   }),
}));

jest.mock('../../services/auth', () => ({
   useCurrentUser: () => ({ data: { user: { ID: 1, username: 'admin', role: 'admin' } } }),
   canWriteRole: (role?: string) => role === 'admin' || role === 'seo',
   isAdminRole: (role?: string) => role === 'admin',
}));

describe('TopBar Component', () => {
   it('renders without crashing', async () => {
       renderWithClient(
          <ThemeProvider>
             <TopBar showSettings={jest.fn} showAddModal={jest.fn} />
          </ThemeProvider>,
       );
       expect(
           await screen.findByText('SerpBear'),
       ).toBeInTheDocument();
   });
});
